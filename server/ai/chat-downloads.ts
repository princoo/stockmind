import { randomBytes } from "node:crypto";

export type StoredChatDownload = {
  userId: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
  expiresAt: number;
};

const DOWNLOAD_TTL_MS = 15 * 60 * 1000;
const MAX_STORED_DOWNLOADS = 200;

const chatDownloads = new Map<string, StoredChatDownload>();

function purgeExpiredDownloads(): void {
  const now = Date.now();
  for (const [token, entry] of chatDownloads) {
    if (entry.expiresAt <= now) {
      chatDownloads.delete(token);
    }
  }

  if (chatDownloads.size <= MAX_STORED_DOWNLOADS) return;

  const sorted = [...chatDownloads.entries()].sort(
    (a, b) => a[1].expiresAt - b[1].expiresAt,
  );
  const overflow = chatDownloads.size - MAX_STORED_DOWNLOADS;
  for (let i = 0; i < overflow; i += 1) {
    chatDownloads.delete(sorted[i]![0]);
  }
}

export function registerChatDownload(input: {
  userId: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): string {
  purgeExpiredDownloads();
  const token = randomBytes(24).toString("hex");
  chatDownloads.set(token, {
    userId: input.userId,
    buffer: input.buffer,
    filename: input.filename,
    mimeType: input.mimeType,
    expiresAt: Date.now() + DOWNLOAD_TTL_MS,
  });
  return token;
}

export function consumeChatDownload(
  token: string,
  userId: string,
): StoredChatDownload | null {
  purgeExpiredDownloads();
  const entry = chatDownloads.get(token);
  if (!entry) return null;
  if (entry.userId !== userId) return null;
  if (entry.expiresAt <= Date.now()) {
    chatDownloads.delete(token);
    return null;
  }
  return entry;
}
