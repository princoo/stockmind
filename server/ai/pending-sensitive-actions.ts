import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type PendingSensitiveAction = {
  userId: string;
  toolName: string;
  argsKey: string;
  summary: string;
  createdAt: number;
};

const PENDING_ACTION_TTL_MS = 10 * 60 * 1000;

const pendingSensitiveActions = new Map<string, PendingSensitiveAction>();

function pendingActionMapKey(userId: string, sessionId: string): string {
  return `${userId}::${sessionId}`;
}

function isExpired(pending: PendingSensitiveAction): boolean {
  return Date.now() - pending.createdAt > PENDING_ACTION_TTL_MS;
}

type StoredPending = {
  toolName: string;
  argsKey: string;
  summary: string;
  createdAt: number;
};

async function loadPendingFromDb(
  userId: string,
  sessionId: string,
): Promise<PendingSensitiveAction | null> {
  const row = await prisma.chatMemory.findUnique({
    where: { userId_sessionId: { userId, sessionId } },
    select: { pendingSensitiveAction: true },
  });
  if (!row?.pendingSensitiveAction || typeof row.pendingSensitiveAction !== "object") {
    return null;
  }
  const raw = row.pendingSensitiveAction as StoredPending;
  if (
    typeof raw.toolName !== "string" ||
    typeof raw.argsKey !== "string" ||
    typeof raw.summary !== "string" ||
    typeof raw.createdAt !== "number"
  ) {
    return null;
  }
  return {
    userId,
    toolName: raw.toolName,
    argsKey: raw.argsKey,
    summary: raw.summary,
    createdAt: raw.createdAt,
  };
}

async function savePendingToDb(
  userId: string,
  sessionId: string,
  pending: PendingSensitiveAction | null,
): Promise<void> {
  const payload = pending
    ? {
        toolName: pending.toolName,
        argsKey: pending.argsKey,
        summary: pending.summary,
        createdAt: pending.createdAt,
      }
    : null;

  const pendingValue =
    payload === null ? Prisma.JsonNull : payload;

  await prisma.chatMemory.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    update: { pendingSensitiveAction: pendingValue },
    create: {
      userId,
      sessionId,
      messages: [],
      pendingSensitiveAction: pendingValue,
    },
  });
}

export async function getPendingSensitiveAction(
  userId: string,
  sessionId: string,
): Promise<PendingSensitiveAction | null> {
  const key = pendingActionMapKey(userId, sessionId);
  let pending = pendingSensitiveActions.get(key) ?? null;

  if (!pending) {
    pending = await loadPendingFromDb(userId, sessionId);
    if (pending) {
      pendingSensitiveActions.set(key, pending);
    }
  }

  if (!pending) return null;
  if (isExpired(pending)) {
    await clearPendingSensitiveAction(userId, sessionId);
    return null;
  }
  return pending;
}

export async function setPendingSensitiveAction(
  userId: string,
  sessionId: string,
  pending: Omit<PendingSensitiveAction, "userId" | "createdAt"> & {
    createdAt?: number;
  },
): Promise<PendingSensitiveAction> {
  const record: PendingSensitiveAction = {
    userId,
    toolName: pending.toolName,
    argsKey: pending.argsKey,
    summary: pending.summary,
    createdAt: pending.createdAt ?? Date.now(),
  };
  const key = pendingActionMapKey(userId, sessionId);
  pendingSensitiveActions.set(key, record);
  await savePendingToDb(userId, sessionId, record);
  return record;
}

export async function clearPendingSensitiveAction(
  userId: string,
  sessionId: string,
): Promise<void> {
  const key = pendingActionMapKey(userId, sessionId);
  pendingSensitiveActions.delete(key);
  await savePendingToDb(userId, sessionId, null);
}
