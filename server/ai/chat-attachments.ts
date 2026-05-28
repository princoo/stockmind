import "server-only";

import mammoth from "mammoth";
import * as XLSX from "xlsx";
import type { MessageContentComplex } from "@langchain/core/messages";
import {
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_ATTACHMENT_MIB,
  MAX_CHAT_ATTACHMENT_TOTAL_MIB,
} from "@/lib/chat-attachment-constants";

const MAX_CHAT_ATTACHMENT_BYTES_PER_FILE = MAX_CHAT_ATTACHMENT_MIB * 1024 * 1024;
const MAX_CHAT_ATTACHMENT_TOTAL_BYTES = MAX_CHAT_ATTACHMENT_TOTAL_MIB * 1024 * 1024;
export const MAX_EXTRACTED_TEXT_PER_OFFICE_FILE = 16_000;
export const MAX_COMBINED_EXTRACTED_TEXT = 48_000;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export type PreparedAttachmentPayload = {
  /** HumanMessage content for Anthropic */
  langchainContent: MessageContentComplex[];
  /** Plain text for chat memory / transcript */
  persistedUserSummary: string;
};

function normalizeMime(file: File): string | null {
  const raw = (file.type ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (raw && ALLOWED_MIME.has(raw)) return raw;
  const lower = file.name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot === -1) return null;
  const ext = lower.slice(dot);
  const inferred = EXT_TO_MIME[ext];
  return inferred && ALLOWED_MIME.has(inferred) ? inferred : null;
}

function truncateWithNotice(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n\n[Truncated — file text exceeded ${max.toLocaleString()} characters.]`;
}

async function extractSpreadsheetText(buffer: Buffer, fileName: string): Promise<string> {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet);
    parts.push(`### Sheet: ${sheetName}\n${csv}`);
  }
  const joined = parts.join("\n\n").trim();
  if (!joined) {
    throw new Error(`Could not read any cells from "${fileName}".`);
  }
  return truncateWithNotice(joined, MAX_EXTRACTED_TEXT_PER_OFFICE_FILE);
}

async function extractDocxText(buffer: Buffer, fileName: string): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = (result.value ?? "").trim();
  if (!text) {
    throw new Error(`No readable text found in Word file "${fileName}".`);
  }
  return truncateWithNotice(text, MAX_EXTRACTED_TEXT_PER_OFFICE_FILE);
}

/**
 * Validates files, extracts office text, returns LangChain multimodal content.
 */
export async function prepareChatAttachments(
  files: File[],
  userMessage: string,
): Promise<{ ok: true; payload: PreparedAttachmentPayload } | { ok: false; message: string }> {
  if (files.length === 0) {
    return { ok: false, message: "No files uploaded." };
  }
  if (files.length > MAX_CHAT_ATTACHMENTS) {
    return {
      ok: false,
      message: `Too many files. Attach at most ${MAX_CHAT_ATTACHMENTS} per message.`,
    };
  }

  let totalBytes = 0;
  const labeled: string[] = [];
  const extractedSections: string[] = [];
  let extractedRunningLength = 0;

  const imageParts: MessageContentComplex[] = [];
  const pdfParts: MessageContentComplex[] = [];

  for (const file of files) {
    if (!(file instanceof Blob) || typeof file.name !== "string") {
      return { ok: false, message: "Invalid upload payload." };
    }
    const size = file.size;
    if (size === 0) {
      return { ok: false, message: `File "${file.name}" is empty.` };
    }
    if (size > MAX_CHAT_ATTACHMENT_BYTES_PER_FILE) {
      return {
        ok: false,
        message: `File "${file.name}" is too large. Maximum size per file is ${(MAX_CHAT_ATTACHMENT_BYTES_PER_FILE / (1024 * 1024)).toFixed(0)} MB.`,
      };
    }
    totalBytes += size;
    if (totalBytes > MAX_CHAT_ATTACHMENT_TOTAL_BYTES) {
      return {
        ok: false,
        message: `Combined attachments exceed ${(MAX_CHAT_ATTACHMENT_TOTAL_BYTES / (1024 * 1024)).toFixed(0)} MB. Remove some files or use smaller files.`,
      };
    }

    const mime = normalizeMime(file as File);
    if (!mime) {
      return {
        ok: false,
        message: `Unsupported file type for "${file.name}". Allowed: JPG, PNG, GIF, WebP, PDF, XLS/XLSX, DOCX.`,
      };
    }

    const buf = Buffer.from(await file.arrayBuffer());

    try {
      if (mime.startsWith("image/")) {
        labeled.push(`${file.name} (image)`);
        imageParts.push({
          type: "image",
          mimeType: mime,
          data: buf.toString("base64"),
        });
      } else if (mime === "application/pdf") {
        labeled.push(`${file.name} (PDF)`);
        pdfParts.push({
          type: "file",
          mimeType: "application/pdf",
          data: buf.toString("base64"),
        });
      } else if (
        mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mime === "application/vnd.ms-excel"
      ) {
        labeled.push(`${file.name} (spreadsheet)`);
        const sheetText = await extractSpreadsheetText(buf, file.name);
        const remaining = MAX_COMBINED_EXTRACTED_TEXT - extractedRunningLength;
        if (remaining <= 0) {
          extractedSections.push(
            `### ${file.name}\n[Skipped — combined text limit already reached for this message.]`,
          );
          continue;
        }
        const slice =
          sheetText.length > remaining ? truncateWithNotice(sheetText, remaining) : sheetText;
        extractedRunningLength += slice.length;
        extractedSections.push(`### ${file.name}\n${slice}`);
      } else if (
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        labeled.push(`${file.name} (Word)`);
        const docText = await extractDocxText(buf, file.name);
        const remaining = MAX_COMBINED_EXTRACTED_TEXT - extractedRunningLength;
        if (remaining <= 0) {
          extractedSections.push(
            `### ${file.name}\n[Skipped — combined text limit already reached for this message.]`,
          );
          continue;
        }
        const slice =
          docText.length > remaining ? truncateWithNotice(docText, remaining) : docText;
        extractedRunningLength += slice.length;
        extractedSections.push(`### ${file.name}\n${slice}`);
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Could not read file.";
      return {
        ok: false,
        message: `Could not process "${file.name}": ${detail}`,
      };
    }
  }

  const trimmedMsg = userMessage.trim();
  const preambleLines = [
    trimmedMsg ||
      "The user attached file(s) without extra instructions. Use them only for StockMind inventory operations (products, categories, suppliers, stock movements, receipts relevant to stock).",
    "",
    `Attachments (${labeled.length}): ${labeled.join("; ")}`,
    "",
    extractedSections.length > 0
      ? [
          "The following text was extracted server-side from spreadsheet or Word files:",
          "",
          extractedSections.join("\n\n"),
        ].join("\n")
      : "",
  ].filter(Boolean);

  const preamble = preambleLines.join("\n").trim();

  const persistedUserSummary = [
    trimmedMsg ||
      "(No message text — attachments only.)",
    `[Attachments: ${labeled.join("; ")}]`,
  ].join("\n");

  const langchainContent: MessageContentComplex[] = [
    { type: "text", text: preamble },
    ...imageParts,
    ...pdfParts,
  ];

  return {
    ok: true,
    payload: {
      langchainContent,
      persistedUserSummary,
    },
  };
}
