"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Mic,
  Paperclip,
  Plus,
  Search,
  SendHorizonal,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { StockPilotVoiceRoom } from "@/components/chat/stockpilot-voice-room";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import {
  CHAT_ATTACHMENT_ACCEPT,
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_ATTACHMENT_MIB,
  MAX_CHAT_ATTACHMENT_TOTAL_MIB,
} from "@/lib/chat-attachment-constants";
import type { InteractionMode } from "@/lib/chat-interaction-mode";

const SESSION_STORAGE_KEY = "stockmind-chat-session-id";

const ATTACHMENT_EXT_RE =
  /\.(jpe?g|png|gif|webp|pdf|xlsx|xls|docx)$/i;

const MAX_BYTES_PER_FILE = MAX_CHAT_ATTACHMENT_MIB * 1024 * 1024;
const MAX_TOTAL_BYTES = MAX_CHAT_ATTACHMENT_TOTAL_MIB * 1024 * 1024;

type ChatRole = "user" | "assistant";

type ChatAttachmentPreview = { name: string };

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  attachments?: ChatAttachmentPreview[];
};

type ResponseMode = "compact" | "detailed";

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

type SessionPreview = {
  sessionId: string;
  title: string;
  snippet: string;
  updatedAt: string;
};

const SUGGESTED_PROMPTS = [
  "Show low stock products",
  "Generate stock report",
  "Add stock to Product X",
  "Show recent transactions",
];

function groupSessionsByDate(sessions: SessionPreview[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const buckets: Record<"Today" | "Yesterday" | "Older", SessionPreview[]> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  for (const session of sessions) {
    const d = new Date(session.updatedAt);
    if (Number.isNaN(d.getTime())) {
      buckets.Today.push(session);
      continue;
    }
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    if (day.getTime() >= startOfToday.getTime()) buckets.Today.push(session);
    else if (day.getTime() >= startOfYesterday.getTime()) buckets.Yesterday.push(session);
    else buckets.Older.push(session);
  }

  return (["Today", "Yesterday", "Older"] as const)
    .map((label) => ({ label, items: buckets[label] }))
    .filter((group) => group.items.length > 0);
}

export function StockPilotWorkspace() {
  const [sessionId, setSessionId] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [responseMode, setResponseMode] = useState<ResponseMode>("detailed");
  const interactionMode: InteractionMode = "text";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [searchText, setSearchText] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [pendingActionSummary, setPendingActionSummary] = useState<string | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hydratingHistory, setHydratingHistory] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [voiceRoomOpen, setVoiceRoomOpen] = useState(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const optimisticUserSeqRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        setSessionId(stored?.trim() || generateSessionId());
      } catch {
        setSessionId(generateSessionId());
      } finally {
        setSessionReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!sessionId.trim()) return;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId.trim());
    } catch {
      /* ignore quota / private mode */
    }
  }, [sessionId]);

  const fetchSessions = useCallback(async () => {
    const response = await fetch("/api/chat/sessions?limit=50");
    const data = (await response.json()) as {
      message?: string;
      sessions?: SessionPreview[];
    };
    if (!response.ok) {
      throw new Error(data.message ?? `Failed to load sessions (${response.status})`);
    }
    setSessions(data.sessions ?? []);
  }, []);

  const syncPendingConfirmation = useCallback(async (sid: string) => {
    const response = await fetch(
      `/api/chat/pending?sessionId=${encodeURIComponent(sid)}`,
    );
    const data = (await response.json()) as {
      pendingConfirmation?: boolean;
      pendingActionSummary?: string | null;
    };
    if (!response.ok) return;
    setPendingConfirmation(Boolean(data.pendingConfirmation));
    setPendingActionSummary(
      typeof data.pendingActionSummary === "string"
        ? data.pendingActionSummary
        : null,
    );
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    queueMicrotask(() => {
      void fetchSessions().catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to load sessions.",
        );
      });
    });
  }, [sessionReady, fetchSessions]);

  useEffect(() => {
    const sid = sessionId.trim();
    if (!sessionReady || !sid) return;

    let cancelled = false;

    const hydrateHistory = async () => {
      try {
        setHydratingHistory(true);
        const response = await fetch(
          `/api/chat/history?sessionId=${encodeURIComponent(sid)}`,
          {
            method: "GET",
          },
        );
        const data = (await response.json()) as {
          message?: string;
          messages?: Array<{ role: "user" | "assistant"; content: string }>;
        };
        if (!response.ok) {
          throw new Error(data.message ?? `History load failed (${response.status})`);
        }

        if (cancelled) return;
        const restored = (data.messages ?? []).map((message, index) => ({
          id: `h-${sid}-${index}`,
          role: message.role,
          content: message.content,
        }));
        setMessages(restored);
        await syncPendingConfirmation(sid);
      } catch (error) {
        if (cancelled) return;
        setMessages([]);
        setPendingConfirmation(false);
        setPendingActionSummary(null);
        toast.error(
          error instanceof Error ? error.message : "Failed to load chat history.",
        );
      } finally {
        if (!cancelled) setHydratingHistory(false);
      }
    };

    void hydrateHistory();

    return () => {
      cancelled = true;
    };
  }, [sessionId, sessionReady, syncPendingConfirmation]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const startNewSession = useCallback(() => {
    const next = generateSessionId();
    setSessionId(next);
    setMessages([]);
    setPendingConfirmation(false);
    setPendingActionSummary(null);
    setSessions((prev) => [
      {
        sessionId: next,
        title: "New chat",
        snippet: "No messages yet",
        updatedAt: new Date().toISOString(),
      },
      ...prev.filter((s) => s.sessionId !== next),
    ]);
    toast.success("Started a new StockPilot session.");
  }, []);

  const validateAttachmentList = (files: File[]): string | null => {
    if (files.length > MAX_CHAT_ATTACHMENTS) {
      return `You can attach up to ${MAX_CHAT_ATTACHMENTS} files per message.`;
    }
    let total = 0;
    for (const f of files) {
      if (!ATTACHMENT_EXT_RE.test(f.name)) {
        return `"${f.name}" is not an allowed type. Use JPG, PNG, GIF, WebP, PDF, XLS/XLSX, or DOCX.`;
      }
      if (f.size > MAX_BYTES_PER_FILE) {
        return `"${f.name}" exceeds ${MAX_CHAT_ATTACHMENT_MIB} MB per file.`;
      }
      total += f.size;
    }
    if (total > MAX_TOTAL_BYTES) {
      return `Combined attachments exceed ${MAX_CHAT_ATTACHMENT_TOTAL_MIB} MB. Remove some files or shrink them.`;
    }
    return null;
  };

  const sendChatMessage = async (text: string, files: File[]) => {
    const sid = sessionId.trim();
    const trimmed = text.trim();
    if ((!trimmed && files.length === 0) || !sid || sending) return;

    const attachmentPreview =
      files.length > 0 ? files.map((f) => ({ name: f.name })) : undefined;

    optimisticUserSeqRef.current += 1;
    const optimisticId = `u-${optimisticUserSeqRef.current}`;
    const userMsg: ChatMessage = {
      id: optimisticId,
      role: "user",
      content: trimmed || "(Attachments only)",
      attachments: attachmentPreview,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    const rollbackOptimisticUser = () => {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    };

    try {
      const res =
        files.length > 0
          ? await postChatMultipart(sid, trimmed, files)
          : await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: sid,
                message: trimmed,
                responseMode,
                interactionMode,
              }),
            });
      const data = (await res.json()) as {
        message?: string;
        pendingConfirmation?: boolean;
        pendingActionSummary?: string | null;
      };

      if (!res.ok) {
        const detail =
          typeof data.message === "string"
            ? data.message
            : `Request failed (${res.status})`;
        toast.error(detail);
        rollbackOptimisticUser();
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: `Something went wrong: ${detail}`,
          },
        ]);
        return;
      }

      const reply =
        typeof data.message === "string" && data.message.trim().length > 0
          ? data.message.trim()
          : "No reply text returned.";

      const hasPending = Boolean(data.pendingConfirmation);
      setPendingConfirmation(hasPending);
      setPendingActionSummary(
        hasPending && typeof data.pendingActionSummary === "string"
          ? data.pendingActionSummary
          : null,
      );

      setInput("");
      setPendingAttachments([]);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: reply },
      ]);
      await fetchSessions();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error.";
      toast.error(msg);
      rollbackOptimisticUser();
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: `Could not reach StockPilot: ${msg}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  async function postChatMultipart(
    sid: string,
    messageText: string,
    files: File[],
  ): Promise<Response> {
    const formData = new FormData();
    formData.append("sessionId", sid);
    formData.append("message", messageText);
    formData.append("responseMode", responseMode);
    formData.append("interactionMode", interactionMode);
    for (const file of files) {
      formData.append("files", file);
    }
    return fetch("/api/chat", {
      method: "POST",
      body: formData,
    });
  }

  const sendMessage = async () => {
    const combined = [...pendingAttachments];
    const err = validateAttachmentList(combined);
    if (err) {
      toast.error(err);
      return;
    }
    await sendChatMessage(input, combined);
  };

  const sendTextOnly = async (text: string) => {
    await sendChatMessage(text, []);
  };

  const submitConfirmation = async (intent: "confirm" | "cancel") => {
    if (sending || !sessionReady || !sessionId.trim() || !pendingConfirmation) {
      return;
    }
    await sendTextOnly(intent);
  };

  const onAttachmentPick = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...pendingAttachments, ...Array.from(list)];
    const err = validateAttachmentList(next);
    if (err) {
      toast.error(err);
      return;
    }
    setPendingAttachments(next);
    toast.success(
      next.length === 1
        ? `Attached ${next[next.length - 1]?.name ?? "file"}.`
        : `${list.length} file(s) added.`,
    );
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const appendVoiceExchange = (userText: string, assistantText: string) => {
    const ts = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: `voice-user-${ts}`, role: "user", content: userText },
      ...(assistantText.trim()
        ? [{ id: `voice-assistant-${ts}`, role: "assistant" as const, content: assistantText }]
        : []),
    ]);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, `voice-${Date.now()}.webm`);

    const response = await fetch("/api/chat/speech-to-text", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      transcript?: string;
      message?: string;
    };

    if (!response.ok) {
      throw new Error(data.message ?? `Transcription failed (${response.status})`);
    }

    const transcript = (data.transcript ?? "").trim();
    if (!transcript) {
      throw new Error("No speech detected. Please try again.");
    }

    setInput((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
  };

  const startRecording = async () => {
    if (
      isRecording ||
      sending ||
      isTranscribing ||
      !sessionReady ||
      !sessionId.trim()
    ) {
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      toast.error("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredType = "audio/webm;codecs=opus";
      const recorder = MediaRecorder.isTypeSupported(preferredType)
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (audioBlob.size === 0) {
          toast.error("No audio captured. Please try again.");
          return;
        }

        try {
          setIsTranscribing(true);
          await transcribeAudio(audioBlob);
          toast.success("Voice converted to text.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Transcription failed.");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      toast.message("Recording started… click stop when done.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not access microphone.",
      );
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
  };

  const currentPreview: SessionPreview = {
    sessionId: sessionId || "draft",
    title: "Current session",
    snippet:
      messages.findLast((m) => m.role === "assistant")?.content.slice(0, 60) ||
      "Your intelligent inventory operations assistant",
    updatedAt: new Date().toISOString(),
  };
  const mergedSessions = [
    currentPreview,
    ...sessions.filter((item) => item.sessionId !== currentPreview.sessionId),
  ];
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleSessions = normalizedSearch
    ? mergedSessions.filter(
        (item) =>
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.snippet.toLowerCase().includes(normalizedSearch),
      )
    : mergedSessions;
  const sessionGroups = groupSessionsByDate(visibleSessions);

  function formatSessionTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Now";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="stockpilot-workspace relative z-0 flex h-full min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-2 md:px-4 md:pb-4">
      <div className="relative z-10 grid h-full min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="stockpilot-glass hidden h-full min-h-0 flex-col overflow-hidden p-4 xl:flex">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0058be]/10 text-[#0058be]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">StockPilot</p>
              <p className="text-[11px] text-zinc-500">Sessions</p>
            </div>
          </div>

          <button
            type="button"
            onClick={startNewSession}
            disabled={sending}
            className="ui-btn-primary mt-4 w-full gap-2 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="ui-input h-9 py-2 pl-9 text-xs"
            />
          </div>

          <div className="stockpilot-scrollbar mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
            {sessionGroups.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {group.label}
                </p>
                {group.items.map((session) => (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => {
                  setSessionId(session.sessionId);
                }}
                className={[
                  "w-full rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                  session.sessionId === sessionId
                    ? "border-blue-200/90 bg-blue-50/90 shadow-sm ring-1 ring-blue-100"
                    : "border-transparent bg-white/50 hover:border-zinc-200/80 hover:bg-white/90",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-zinc-900">
                    {session.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-zinc-500">
                    {formatSessionTime(session.updatedAt)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-zinc-600">
                  {session.snippet}
                </p>
              </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <section className="stockpilot-chat-shell flex h-full min-h-0 flex-col overflow-hidden">
          <header className="stockpilot-floating-bar mx-3 mt-3 flex shrink-0 items-center justify-between px-4 py-3 md:mx-4 md:px-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-[#0b63cf]">
                  StockPilot
                </h1>
                <p className="text-[11px] text-zinc-500">
                  Inventory operations assistant
                </p>
              </div>
            </div>
            <div className="inline-flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={startNewSession}
                disabled={sending}
                className="ui-btn-secondary h-9 px-3 py-1.5 text-xs xl:hidden"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
              <label
                htmlFor="response-mode"
                className="hidden text-xs font-medium text-zinc-500 md:block"
              >
                Response
              </label>
              <select
                id="response-mode"
                value={responseMode}
                onChange={(e) => setResponseMode(e.target.value as ResponseMode)}
                disabled={sending}
                className="ui-select h-9 w-auto min-w-[7.5rem] py-1.5 text-xs disabled:opacity-60"
              >
                <option value="detailed">Detailed</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </header>

          <div className="stockpilot-scrollbar min-h-0 flex-1 overflow-y-auto px-1">
            <div className="mx-auto w-full max-w-2xl space-y-3 px-4 py-4 md:px-6">
            {!sessionReady || hydratingHistory ? (
              <div className="space-y-3 py-10">
                <div className="mx-auto h-4 max-w-[60%] animate-pulse rounded-md bg-zinc-200" />
                <div className="mx-auto h-4 max-w-[85%] animate-pulse rounded-md bg-zinc-100" />
                <div className="mx-auto h-4 max-w-[70%] animate-pulse rounded-md bg-zinc-100" />
              </div>
            ) : messages.length === 0 && !sending ? (
              <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#0058be]/15 to-[#0b63cf]/5 ring-1 ring-blue-100">
                  <Sparkles className="h-8 w-8 text-[#0058be]" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#0b63cf] md:text-3xl">
                  StockPilot
                </h2>
                <p className="mt-2 max-w-md text-sm text-zinc-600">
                  Your intelligent inventory operations assistant
                </p>
                <p className="mt-3 max-w-sm text-xs text-zinc-500">
                  Ask about stock levels, reports, transactions, or run operational commands.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[88%] ${
                      m.role === "user"
                        ? "bg-[#0058be] text-white"
                        : "border border-zinc-200/90 bg-white text-zinc-900"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                      {m.role === "user" ? "You" : "StockPilot"}
                    </p>
                    <div className="mt-1">
                      {m.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
                            ),
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => (
                              <strong className="font-semibold">{children}</strong>
                            ),
                            code: ({ children }) => (
                              <code className="rounded bg-zinc-100 px-1 py-0.5 text-[0.85em]">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="space-y-2">
                          {m.attachments?.length ? (
                            <ul className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] leading-snug">
                              {m.attachments.map((a) => (
                                <li key={a.name}>Attached: {a.name}</li>
                              ))}
                            </ul>
                          ) : null}
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {sending ? (
              <div className="flex w-full justify-start">
                <div className="max-w-[92%] rounded-2xl border border-zinc-200/90 bg-white px-4 py-3 text-sm text-zinc-600 sm:max-w-[88%]">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-[#0058be]"
                      aria-hidden
                    />
                    Thinking…
                  </span>
                </div>
              </div>
            ) : null}
            <div ref={listEndRef} />
            </div>
          </div>

          <footer className="shrink-0 px-3 pb-3 pt-2 md:px-4 md:pb-4">
            <div className="stockpilot-floating-bar mx-auto w-full max-w-2xl space-y-3 p-4 md:p-5">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => void sendTextOnly(action)}
                  disabled={sending || !sessionReady}
                  className="rounded-full border border-white/50 bg-white/35 px-3.5 py-1.5 text-xs font-medium text-[#0058be] backdrop-blur-sm transition hover:border-blue-200/80 hover:bg-white/50 disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>

            {pendingConfirmation ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="mr-2 text-xs text-amber-800">
                  Sensitive action pending:
                  {pendingActionSummary ? ` ${pendingActionSummary}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => void submitConfirmation("confirm")}
                  disabled={sending}
                  className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => void submitConfirmation("cancel")}
                  disabled={sending}
                  className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            <input
              ref={attachmentInputRef}
              type="file"
              className="sr-only"
              accept={CHAT_ATTACHMENT_ACCEPT}
              multiple
              onChange={(e) => {
                onAttachmentPick(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="stockpilot-command">
              {pendingAttachments.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-1.5 px-1">
                  {pendingAttachments.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(index)}
                        className="rounded-full p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  disabled={sending || !sessionReady || !sessionId.trim()}
                  onClick={() => setVoiceRoomOpen(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#0058be]/30 bg-linear-to-r from-[#0058be]/10 to-[#0b63cf]/10 px-2.5 py-2 text-xs font-semibold text-[#0058be] shadow-sm transition hover:border-[#0058be]/45 hover:from-[#0058be]/15 hover:to-[#0b63cf]/15 disabled:opacity-50"
                  title="Open fullscreen voice conversation"
                >
                  <AudioLines className="h-4 w-4" />
                  <span className="hidden sm:inline">Voice chat</span>
                </button>
                <button
                  type="button"
                  disabled={
                    sending ||
                    !sessionReady ||
                    !sessionId.trim() ||
                    pendingAttachments.length >= MAX_CHAT_ATTACHMENTS
                  }
                  onClick={() => attachmentInputRef.current?.click()}
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40"
                  title={`Attach files (max ${MAX_CHAT_ATTACHMENTS} · ${MAX_CHAT_ATTACHMENT_MIB} MB each · ${MAX_CHAT_ATTACHMENT_TOTAL_MIB} MB total)`}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : () => void startRecording()}
                  disabled={
                    sending || isTranscribing || !sessionReady || !sessionId.trim()
                  }
                  className={`rounded-lg p-2 transition disabled:opacity-50 ${
                    isRecording
                      ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                  }`}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
                <label htmlFor="chat-input" className="sr-only">
                  Message
                </label>
                <textarea
                  id="chat-input"
                  rows={2}
                  value={input}
                  disabled={sending || !sessionReady || !sessionId.trim()}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder={
                    sessionReady && sessionId.trim()
                      ? "Ask StockPilot anything about your inventory operations..."
                      : "Loading StockPilot session..."
                  }
                  className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={
                    sending ||
                    !sessionReady ||
                    (!input.trim() && pendingAttachments.length === 0) ||
                    !sessionId.trim()
                  }
                  onClick={() => void sendMessage()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0058be] text-white shadow-[0_8px_20px_rgba(0,88,190,0.3)] transition hover:-translate-y-0.5 hover:bg-[#004ca3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendHorizonal className="h-4 w-4" />
                </button>
              </div>
            </div>
            {isTranscribing ? (
              <p className="text-xs text-zinc-500">
                Transcribing audio with Deepgram…
              </p>
            ) : null}

            <p className="text-[11px] text-zinc-500">
              Attachments: JPG, PNG, GIF, WebP, PDF, XLS/XLSX, DOCX — up to{" "}
              {MAX_CHAT_ATTACHMENTS} files, {MAX_CHAT_ATTACHMENT_MIB} MB each,{" "}
              {MAX_CHAT_ATTACHMENT_TOTAL_MIB} MB combined.
            </p>

            <div className="flex justify-end text-[11px] text-zinc-500">
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setPendingConfirmation(false);
                  setPendingActionSummary(null);
                  toast.message("Cleared messages on screen only.");
                }}
                disabled={sending}
                className="text-zinc-600 transition hover:text-zinc-900 disabled:opacity-50"
              >
                Clear transcript
              </button>
            </div>
            </div>
          </footer>
        </section>
      </div>

      {voiceRoomOpen && sessionReady && sessionId.trim() ? (
        <StockPilotVoiceRoom
          sessionId={sessionId}
          responseMode={responseMode}
          pendingConfirmation={pendingConfirmation}
          pendingActionSummary={pendingActionSummary}
          onClose={() => setVoiceRoomOpen(false)}
          onExchange={appendVoiceExchange}
          onPendingChange={(pending, summary) => {
            setPendingConfirmation(pending);
            setPendingActionSummary(summary);
          }}
        />
      ) : null}
    </div>
  );
}
