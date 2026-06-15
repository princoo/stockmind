import { AIMessage, type BaseMessage } from "@langchain/core/messages";

const EMOJI_RE = /\p{Extended_Pictographic}/gu;
const DECORATIVE_SYMBOLS_RE = /[✓✔✅⚠️⚠❌🔴🟡🟢⭐•→←↔︎]/g;

function extractTextContent(content: unknown): string {
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

export function sanitizeVoiceResponseText(text: string): string {
  let out = text.trim();
  if (!out) return out;

  out = out.replace(EMOJI_RE, "");
  out = out.replace(DECORATIVE_SYMBOLS_RE, "");

  out = out.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/```\w*\n?/g, "").replace(/```/g, "").trim(),
  );
  out = out.replace(/`([^`]+)`/g, "$1");
  out = out.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
  out = out.replace(/__([^_]+)__/g, "$1");
  out = out.replace(/\*([^*]+)\*/g, "$1");
  out = out.replace(/_([^_]+)_/g, "$1");
  out = out.replace(/^#{1,6}\s+/gm, "");
  out = out.replace(/^\s*>\s?/gm, "");
  out = out.replace(/^\s*[-*+]\s+/gm, "");
  out = out.replace(/^\s*\d+\.\s+/gm, "");
  out = out.replace(/^[-*_]{3,}\s*$/gm, "");

  out = out.replace(/[ \t]+\n/g, "\n");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/[ \t]{2,}/g, " ");

  return out.trim();
}

export function buildVoiceResponseStyleContract(): string {
  return [
    "## Voice Response Format (mandatory)",
    "",
    "The user is in voice chat. Every reply is shown as plain text and read aloud.",
    "",
    "Output plain spoken prose only:",
    "- No Markdown: no bold, italic, headers, bullet lists, numbered lists, code blocks, or backticks.",
    "- No emojis or decorative symbols (no checkmarks, warning icons, bullets, arrows, etc.).",
    "- No HTML or other formatting markers.",
    "- Use short sentences and natural paragraphs suitable for speech.",
    "- State product names, quantities, and RWF amounts in plain words.",
    "",
    'Wrong: "**Surgical Gloves** (`MED-GL-001`) deleted. ✓"',
    'Right: "Surgical Gloves, MED-GL-001, has been deleted successfully."',
  ].join("\n");
}

export function sanitizeVoiceSessionMessages(
  messages: BaseMessage[],
  interactionMode: "text" | "voice",
): BaseMessage[] {
  if (interactionMode !== "voice") return messages;

  return messages.map((msg) => {
    if (!(msg instanceof AIMessage) || (msg.tool_calls?.length ?? 0) > 0) {
      return msg;
    }

    const sanitized = sanitizeVoiceResponseText(extractTextContent(msg.content));
    return new AIMessage({
      content: sanitized,
      tool_calls: msg.tool_calls,
    });
  });
}
