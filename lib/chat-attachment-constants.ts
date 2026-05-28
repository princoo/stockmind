/** Shared limits — keep server extraction logic aligned (`server/ai/chat-attachments.ts`). */

export const CHAT_ATTACHMENT_ACCEPT =
  ".jpg,.jpeg,.png,.gif,.webp,.pdf,.xlsx,.xls,.docx";

export const MAX_CHAT_ATTACHMENTS = 5;

/** MiB per file (human-readable hints in UI). */
export const MAX_CHAT_ATTACHMENT_MIB = 2;

/** Combined uploads cap (MiB). */
export const MAX_CHAT_ATTACHMENT_TOTAL_MIB = 6;
