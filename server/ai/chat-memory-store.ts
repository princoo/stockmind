import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";

type PersistedMessage = {
  role: "human" | "ai";
  content: string;
};

export type SessionTranscriptMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSessionListItem = {
  sessionId: string;
  title: string;
  snippet: string;
  updatedAt: string;
};

const DEFAULT_EMPTY_HISTORY: PersistedMessage[] = [];

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: string }).type === "text"
        ) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function toPersisted(messages: BaseMessage[]): PersistedMessage[] {
  const output: PersistedMessage[] = [];

  for (const msg of messages) {
    const text = contentToText(msg.content).trim();
    if (!text) continue;

    if (msg instanceof HumanMessage) {
      output.push({ role: "human", content: text });
      continue;
    }

    if (msg instanceof AIMessage && !(msg.tool_calls?.length ?? 0)) {
      output.push({ role: "ai", content: text });
    }
  }

  return output;
}

function fromPersisted(messages: PersistedMessage[]): BaseMessage[] {
  return messages.map((msg) =>
    msg.role === "human"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content),
  );
}

function toTranscript(messages: PersistedMessage[]): SessionTranscriptMessage[] {
  return messages.map((msg) => ({
    role: msg.role === "human" ? "user" : "assistant",
    content: msg.content,
  }));
}

async function readPersistedHistory(
  userId: string,
  sessionId: string,
): Promise<PersistedMessage[]> {
  const row = await prisma.chatMemory.findUnique({
    where: { userId_sessionId: { userId, sessionId } },
  });
  if (!row) return [];

  const raw = row.messages;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = (item as { role?: unknown }).role;
      const content = (item as { content?: unknown }).content;
      if (
        (role === "human" || role === "ai") &&
        typeof content === "string" &&
        content.trim().length > 0
      ) {
        return { role, content };
      }
      return null;
    })
    .filter((item): item is PersistedMessage => item !== null);
}

export async function loadSessionHistory(
  userId: string,
  sessionId: string,
): Promise<BaseMessage[]> {
  const safeHistory = await readPersistedHistory(userId, sessionId);
  return fromPersisted(safeHistory);
}

export async function loadSessionTranscript(
  userId: string,
  sessionId: string,
): Promise<SessionTranscriptMessage[]> {
  const safeHistory = await readPersistedHistory(userId, sessionId);
  return toTranscript(safeHistory);
}

export async function saveSessionHistory(
  userId: string,
  sessionId: string,
  messages: BaseMessage[],
  windowSize: number,
): Promise<void> {
  const persisted = toPersisted(messages);
  const trimmed = persisted.slice(-windowSize);

  await prisma.chatMemory.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    update: { messages: trimmed },
    create: {
      userId,
      sessionId,
      messages: trimmed.length > 0 ? trimmed : DEFAULT_EMPTY_HISTORY,
    },
  });
}

function toSessionPreview(item: PersistedMessage[] | null): {
  title: string;
  snippet: string;
} {
  if (!item || item.length === 0) {
    return {
      title: "New chat",
      snippet: "No messages yet",
    };
  }

  const firstUser = item.find((m) => m.role === "human")?.content.trim();
  const last = item[item.length - 1]?.content.trim() ?? "";
  const titleSource = firstUser || last || "Chat session";
  const snippetSource = last || firstUser || "No messages yet";

  return {
    title: titleSource.slice(0, 48),
    snippet: snippetSource.slice(0, 90),
  };
}

export async function listUserSessions(
  userId: string,
  limit = 30,
): Promise<ChatSessionListItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const rows = await prisma.chatMemory.findMany({
    where: { userId },
    select: {
      sessionId: true,
      messages: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: safeLimit,
  });

  return rows.map((row) => {
    const raw = Array.isArray(row.messages) ? row.messages : null;
    const safeHistory: PersistedMessage[] | null = raw
      ? raw
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const role = (item as { role?: unknown }).role;
            const content = (item as { content?: unknown }).content;
            if (
              (role === "human" || role === "ai") &&
              typeof content === "string" &&
              content.trim().length > 0
            ) {
              return { role, content };
            }
            return null;
          })
          .filter((item): item is PersistedMessage => item !== null)
      : null;

    const preview = toSessionPreview(safeHistory);
    return {
      sessionId: row.sessionId,
      title: preview.title || "Chat session",
      snippet: preview.snippet || "No messages yet",
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}
