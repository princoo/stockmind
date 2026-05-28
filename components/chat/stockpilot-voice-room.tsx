"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Loader2,
  Mic,
  Pause,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import type { StockPilotResponseMode } from "@/lib/stockpilot-voice-api";
import {
  postStockPilotChat,
  synthesizeVoiceResponse,
  transcribeVoiceAudio,
} from "@/lib/stockpilot-voice-api";
import {
  playVoiceRoomCue,
  VoiceRoomProcessingTone,
} from "@/lib/voice-room-audio";

export type VoiceRoomPhase =
  | "idle"
  | "recording"
  | "transcribing"
  | "processing"
  | "speaking"
  | "awaiting_confirm"
  | "error";

type StockPilotVoiceRoomProps = {
  sessionId: string;
  responseMode: StockPilotResponseMode;
  onClose: () => void;
  onExchange: (userText: string, assistantText: string) => void;
  pendingConfirmation: boolean;
  pendingActionSummary: string | null;
  onPendingChange: (
    pending: boolean,
    summary: string | null,
  ) => void;
};

const STATUS_BY_PHASE: Record<VoiceRoomPhase, string> = {
  idle: "Press and hold to speak",
  recording: "Listening…",
  transcribing: "Understanding your request…",
  processing: "Processing request…",
  speaking: "StockPilot is responding…",
  awaiting_confirm: "Confirm the pending action to continue",
  error: "Something went wrong",
};

function pickMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  if (typeof MediaRecorder === "undefined") return undefined;
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export function StockPilotVoiceRoom({
  sessionId,
  responseMode,
  onClose,
  onExchange,
  pendingConfirmation,
  pendingActionSummary,
  onPendingChange,
}: StockPilotVoiceRoomProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<VoiceRoomPhase>(
    pendingConfirmation ? "awaiting_confirm" : "idle",
  );
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ttsUnavailable, setTtsUnavailable] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const holdActiveRef = useRef(false);
  const pipelineBusyRef = useRef(false);
  const processingToneRef = useRef(new VoiceRoomProcessingTone());
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioUrlRef = useRef<string | null>(null);
  const speakingPulseRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [speakingPulse, setSpeakingPulse] = useState(0);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      processingToneRef.current.stop();
      stopPlayback();
      releaseMedia();
    };
  }, []);

  useEffect(() => {
    if (pendingConfirmation) {
      setPhase((p) =>
        p === "recording" || p === "transcribing" || p === "processing"
          ? p
          : "awaiting_confirm",
      );
    }
  }, [pendingConfirmation]);

  const releaseMedia = () => {
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
  };

  const stopPlayback = () => {
    if (speakingPulseRef.current) {
      clearInterval(speakingPulseRef.current);
      speakingPulseRef.current = null;
    }
    setSpeakingPulse(0);
    const audio = playbackAudioRef.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      playbackAudioRef.current = null;
    }
  };

  const revokeLastAudioUrl = () => {
    if (lastAudioUrlRef.current) {
      URL.revokeObjectURL(lastAudioUrlRef.current);
      lastAudioUrlRef.current = null;
    }
  };

  const setError = (message: string) => {
    processingToneRef.current.stop();
    stopPlayback();
    setErrorMessage(message);
    setPhase("error");
    pipelineBusyRef.current = false;
  };

  const playResponseAudio = async (
    text: string,
    pendingAfter: boolean,
  ) => {
    setTtsUnavailable(false);
    try {
      const blob = await synthesizeVoiceResponse(text);
      revokeLastAudioUrl();
      const url = URL.createObjectURL(blob);
      lastAudioUrlRef.current = url;

      const audio = new Audio(url);
      playbackAudioRef.current = audio;
      setPhase("speaking");

      speakingPulseRef.current = setInterval(() => {
        setSpeakingPulse((n) => (n + 1) % 100);
      }, 120);

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Audio playback failed"));
        void audio.play().catch(reject);
      });
    } catch (err) {
      setTtsUnavailable(true);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Could not generate speech. Showing text only.",
      );
    } finally {
      if (speakingPulseRef.current) {
        clearInterval(speakingPulseRef.current);
        speakingPulseRef.current = null;
      }
      setSpeakingPulse(0);
      playbackAudioRef.current = null;
      pipelineBusyRef.current = false;
      setPhase(pendingAfter ? "awaiting_confirm" : "idle");
    }
  };

  const runAssistantPipeline = async (transcript: string) => {
    setAssistantTranscript("");
    setPhase("processing");
    processingToneRef.current.start();

    try {
      const result = await postStockPilotChat({
        sessionId,
        message: transcript,
        responseMode,
        interactionMode: "voice",
      });

      processingToneRef.current.stop();
      onPendingChange(
        result.pendingConfirmation,
        result.pendingActionSummary,
      );

      const reply = result.reply.trim();
      setAssistantTranscript(reply);
      onExchange(transcript, reply);

      if (result.pendingConfirmation) {
        setPhase("awaiting_confirm");
        pipelineBusyRef.current = false;
        return;
      }

      if (reply) {
        await playResponseAudio(reply, result.pendingConfirmation);
      } else {
        setPhase(result.pendingConfirmation ? "awaiting_confirm" : "idle");
        pipelineBusyRef.current = false;
      }
    } catch {
      processingToneRef.current.stop();
      setError("Request processing failed");
    }
  };

  const processRecording = async () => {
    if (pipelineBusyRef.current) return;
    pipelineBusyRef.current = true;
    setErrorMessage(null);

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      pipelineBusyRef.current = false;
      setPhase(pendingConfirmation ? "awaiting_confirm" : "idle");
      return;
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const mime = recorder.mimeType || "audio/webm";
        resolve(new Blob(audioChunksRef.current, { type: mime }));
      };
      recorder.onerror = () => reject(new Error("Recording failed"));
      recorder.stop();
    });

    releaseMedia();

    if (blob.size < 400) {
      pipelineBusyRef.current = false;
      setPhase(pendingConfirmation ? "awaiting_confirm" : "idle");
      return;
    }

    setPhase("transcribing");
    try {
      const transcript = await transcribeVoiceAudio(blob);
      setUserTranscript(transcript);
      playVoiceRoomCue("end");
      await runAssistantPipeline(transcript);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not understand input";
      if (msg.toLowerCase().includes("understand")) {
        setError("Could not understand input");
      } else {
        setError(msg);
      }
    }
  };

  const startRecording = async () => {
    if (
      holdActiveRef.current ||
      pipelineBusyRef.current ||
      phase === "processing" ||
      phase === "transcribing" ||
      phase === "speaking" ||
      pendingConfirmation
    ) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(120);
      holdActiveRef.current = true;
      setErrorMessage(null);
      setPhase("recording");
      playVoiceRoomCue("start");
    } catch {
      releaseMedia();
      setError("Microphone access is required for voice chat.");
    }
  };

  const stopRecordingFromHold = () => {
    if (!holdActiveRef.current) return;
    holdActiveRef.current = false;

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setPhase(pendingConfirmation ? "awaiting_confirm" : "idle");
      return;
    }

    void processRecording();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    void startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    stopRecordingFromHold();
  };

  const handleConfirm = async (intent: "confirm" | "cancel") => {
    if (pipelineBusyRef.current) return;
    pipelineBusyRef.current = true;
    setPhase("processing");
    processingToneRef.current.start();
    setUserTranscript(intent === "confirm" ? "Confirm" : "Cancel");

    try {
      const result = await postStockPilotChat({
        sessionId,
        message: intent,
        responseMode,
        interactionMode: "voice",
      });
      processingToneRef.current.stop();
      onPendingChange(
        result.pendingConfirmation,
        result.pendingActionSummary,
      );
      const reply = result.reply.trim();
      setAssistantTranscript(reply);
      onExchange(intent, reply);

      if (reply && !result.pendingConfirmation) {
        await playResponseAudio(reply, result.pendingConfirmation);
      } else {
        setPhase(result.pendingConfirmation ? "awaiting_confirm" : "idle");
        pipelineBusyRef.current = false;
      }
    } catch {
      processingToneRef.current.stop();
      setError("Request processing failed");
    }
  };

  const handleReplay = () => {
    if (!lastAudioUrlRef.current || !assistantTranscript.trim()) return;
    stopPlayback();
    const audio = new Audio(lastAudioUrlRef.current);
    playbackAudioRef.current = audio;
    setPhase("speaking");
    speakingPulseRef.current = setInterval(() => {
      setSpeakingPulse((n) => (n + 1) % 100);
    }, 120);
    audio.onended = () => {
      if (speakingPulseRef.current) clearInterval(speakingPulseRef.current);
      setSpeakingPulse(0);
      playbackAudioRef.current = null;
      setPhase(pendingConfirmation ? "awaiting_confirm" : "idle");
    };
    void audio.play();
  };

  const handleStopSpeaking = () => {
    stopPlayback();
    setPhase(pendingConfirmation ? "awaiting_confirm" : "idle");
    pipelineBusyRef.current = false;
  };

  const resetError = () => {
    setErrorMessage(null);
    setPhase(pendingConfirmation ? "awaiting_confirm" : "idle");
  };

  const statusText =
    phase === "error" && errorMessage
      ? errorMessage
      : STATUS_BY_PHASE[phase];

  const [animTick, setAnimTick] = useState(0);

  useEffect(() => {
    if (phase !== "recording" && phase !== "speaking") return;
    const id = setInterval(() => setAnimTick((t) => t + 1), 60);
    return () => clearInterval(id);
  }, [phase]);

  const buttonDisabled =
    phase === "transcribing" ||
    phase === "processing" ||
    phase === "speaking" ||
    pendingConfirmation;

  const pulseScale =
    phase === "recording"
      ? 1 + Math.sin(animTick / 3) * 0.06
      : phase === "speaking"
        ? 1 + Math.sin((speakingPulse / 100) * Math.PI * 2) * 0.05
        : 1;

  if (!mounted) return null;

  return createPortal(
    <div
      className="stockpilot-voice-room fixed inset-0 z-[10000] flex h-dvh max-h-dvh flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="StockPilot voice conversation"
    >
      <div className="stockpilot-voice-room__scrim pointer-events-none absolute inset-0" aria-hidden />
      <header className="stockpilot-voice-room__header relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0058be]/10 text-[#0058be]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              StockPilot
            </h1>
            <p className="text-xs text-zinc-500">Voice operations room</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="max-w-[9rem] truncate rounded-full border border-[#0058be]/20 bg-[#0058be]/8 px-3 py-1 text-xs font-medium text-[#0058be] sm:max-w-none">
            {phase === "error" && errorMessage ? "Error" : STATUS_BY_PHASE[phase]}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/60 bg-white/50 p-2.5 text-zinc-600 shadow-sm backdrop-blur-md transition hover:bg-white/80 hover:text-zinc-900"
            aria-label="Close voice chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="stockpilot-voice-room__stage relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <div
          className={`stockpilot-voice-room__orb-wrap ${
            phase === "processing" ? "stockpilot-voice-room__orb-wrap--processing" : ""
          } ${phase === "speaking" ? "stockpilot-voice-room__orb-wrap--speaking" : ""}`}
        >
          {phase === "recording" ? (
            <span className="stockpilot-voice-room__ripple" aria-hidden />
          ) : null}
          <button
            type="button"
            disabled={buttonDisabled}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`stockpilot-voice-room__orb ${
              phase === "recording" ? "stockpilot-voice-room__orb--recording" : ""
            } ${phase === "processing" ? "stockpilot-voice-room__orb--processing" : ""} ${
              phase === "speaking" ? "stockpilot-voice-room__orb--speaking" : ""
            } ${phase === "error" ? "stockpilot-voice-room__orb--error" : ""}`}
            style={{ transform: `scale(${pulseScale})` }}
            aria-label={
              phase === "idle"
                ? "Press and hold to speak"
                : STATUS_BY_PHASE[phase]
            }
          >
            {phase === "transcribing" || phase === "processing" ? (
              <Loader2 className="h-12 w-12 animate-spin text-white/90" />
            ) : phase === "error" ? (
              <AlertCircle className="h-12 w-12 text-white/90" />
            ) : (
              <Mic className="h-14 w-14 text-white/95" strokeWidth={1.5} />
            )}
          </button>
          {phase === "idle" ? (
            <p className="pointer-events-none absolute -bottom-9 left-1/2 w-max -translate-x-1/2 text-center text-xs font-medium text-zinc-600">
              Press and hold
            </p>
          ) : null}
        </div>

        {phase === "speaking" ? (
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={handleStopSpeaking}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 px-4 py-2 text-xs font-medium text-zinc-700 backdrop-blur-md transition hover:bg-white/80"
            >
              <Pause className="h-3.5 w-3.5" />
              Stop
            </button>
            <button
              type="button"
              onClick={handleReplay}
              disabled={!lastAudioUrlRef.current}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 px-4 py-2 text-xs font-medium text-zinc-700 backdrop-blur-md transition hover:bg-white/80 disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Replay
            </button>
          </div>
        ) : null}

        {phase === "awaiting_confirm" ? (
          <div className="mt-8 flex flex-wrap justify-center gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 backdrop-blur-md">
            <p className="w-full text-center text-xs text-amber-900">
              {pendingActionSummary
                ? `Pending: ${pendingActionSummary}`
                : "Sensitive action requires confirmation"}
            </p>
            <button
              type="button"
              onClick={() => void handleConfirm("confirm")}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm("cancel")}
              className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50"
            >
              Cancel
            </button>
          </div>
        ) : null}

        {phase === "error" ? (
          <button
            type="button"
            onClick={resetError}
            className="mt-6 rounded-full bg-[#0058be] px-5 py-2 text-sm font-medium text-white hover:bg-[#004ca3]"
          >
            Try again
          </button>
        ) : null}
      </div>

      <footer className="stockpilot-voice-room__footer relative z-10 mx-auto mb-8 w-full max-w-lg px-6 pb-6">
        <p className="mb-4 text-center text-sm font-medium text-[#0058be]">
          {statusText}
        </p>
        <div className="stockpilot-voice-room__previews space-y-3">
          {userTranscript ? (
            <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                You said
              </p>
              <p className="text-sm text-zinc-800">{userTranscript}</p>
            </div>
          ) : null}
          {assistantTranscript ? (
            <div className="rounded-xl border border-[#0058be]/20 bg-white px-4 py-3 shadow-sm">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#0058be]">
                StockPilot
                {ttsUnavailable ? " (text only — audio unavailable)" : ""}
              </p>
              <p className="text-sm text-zinc-800">{assistantTranscript}</p>
            </div>
          ) : null}
        </div>
      </footer>
    </div>,
    document.body,
  );
}
