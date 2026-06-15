import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
  type HumanMessageFields,
} from "@langchain/core/messages";
import { getInventoryTools } from "@/server/ai/inventory-tools";
import { authOptions } from "@/lib/auth/options";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import {
  loadSessionHistory,
  saveSessionHistory,
} from "@/server/ai/chat-memory-store";
import { prepareChatAttachments } from "@/server/ai/chat-attachments";
import {
  clearPendingSensitiveAction,
  getPendingSensitiveAction,
  setPendingSensitiveAction,
  type PendingSensitiveAction,
} from "@/server/ai/pending-sensitive-actions";
import {
  buildVoiceResponseStyleContract,
  sanitizeVoiceResponseText,
  sanitizeVoiceSessionMessages,
} from "@/server/ai/voice-response-text";
import type { ChatDownloadOffer } from "@/lib/chat-download";

const CHAT_WINDOW_SIZE = 10;
const MAX_TOOL_ROUNDS = 4;

const interactionModeSchema = z.enum(["text", "voice"]);

const requestSchema = z.object({
  sessionId: z.string().trim().min(1),
  message: z.string().trim().min(1),
  responseMode: z.enum(["compact", "detailed"]).optional(),
  interactionMode: interactionModeSchema.optional(),
});

function parseInteractionMode(value: unknown): "text" | "voice" {
  const parsed = interactionModeSchema.safeParse(value);
  return parsed.success ? parsed.data : "text";
}

function loadSystemContextMarkdown(): string {
  const path = join(process.cwd(), "server", "ai", "system-context.md");
  return readFileSync(path, "utf8");
}

const systemContextMarkdown = loadSystemContextMarkdown();

function buildRuntimeSessionContext(input: {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  role: string;
  permissions: string[];
}) {
  const identityLine = [
    `id=${input.userId}`,
    `name=${input.userName ?? "unknown"}`,
    `email=${input.userEmail ?? "unknown"}`,
    `role=${input.role}`,
  ].join(", ");

  return [
    "## Runtime Session Context",
    "",
    "Current authenticated user for this request:",
    `- ${identityLine}`,
    "",
    "Allowed permissions for this user:",
    ...input.permissions.map((permission) => `- ${permission}`),
    "",
    "Instructions:",
    "- You can and should use this runtime context to decide what the user is allowed to do.",
    "- Never claim you cannot know the current user or role; this section is authoritative for this request.",
    "- For any action outside allowed permissions, refuse and explain the missing permission.",
    "- When the user wants a downloadable Excel/spreadsheet of products, call exportProductsSpreadsheet; StockPilot will show a download button.",
    "- List tools return the full matching dataset (not paginated). Do not ask the user for a page number or assume partial results.",
  ].join("\n");
}

function buildResponseStyleContract(responseMode: "compact" | "detailed") {
  const modeSpecific =
    responseMode === "compact"
      ? [
          "- Target 2-5 short bullet points or 1 short paragraph.",
          "- For operation results, include only essential fields and one next step.",
        ]
      : [
          "- Provide clear structure with short sections when helpful.",
          "- For operation results, include key fields, outcome, and concise follow-up guidance.",
        ];

  return [
    "## Response Style Contract",
    "",
    "- Use clean Markdown only (paragraphs, short bullet lists, numbered lists, bold, inline code).",
    "- Do not output raw HTML.",
    "- Prefer plain Unicode symbols only when useful (e.g., `-`, `✓`, `⚠️`).",
    "- Keep responses concise and scannable. Avoid decorative formatting.",
    "- For inventories/lists, use bullets or numbered lists; include key numeric values clearly.",
    "- Currency rule: all prices and monetary values must be shown in `RWF` (e.g., `RWF 30,000`), never `$`.",
    "- For sensitive updates/deletes/stock mutations: call the matching tool immediately so the Confirm/Cancel UI appears, summarize the intended change, and wait for confirmation before claiming success.",
    ...modeSpecific,
  ].join("\n");
}

function buildVoiceChatModeContract(): string {
  return [
    "## Voice Chat Mode",
    "",
    "You are in voice chat mode (speech in, spoken reply out).",
    "- Keep the same factual accuracy and tool usage as text mode.",
    "- Do not mention voice mode unless the user asks.",
    "- Follow the Voice Response Format rules above; they override any Markdown formatting guidance.",
  ].join("\n");
}

function buildSystemPromptSections(input: {
  runtimeSessionContext: string;
  pendingActionContext: string;
  responseStyleContract: string;
  interactionMode: "text" | "voice";
}): string {
  const responseStyle =
    input.interactionMode === "voice"
      ? buildVoiceResponseStyleContract()
      : input.responseStyleContract;

  const sections = [
    systemContextMarkdown,
    input.runtimeSessionContext,
    input.pendingActionContext,
    responseStyle,
  ];
  if (input.interactionMode === "voice") {
    sections.push(buildVoiceChatModeContract());
  }
  return sections.join("\n\n");
}

function getAIText(message: AIMessage): string {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) {
    return message.content
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

function asErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected AI orchestration error.";
}

type ToolInvoker = {
  invoke: (args: unknown) => Promise<unknown>;
};

type ConfirmationIntent = "confirm" | "cancel" | null;

const SENSITIVE_TOOLS = new Set([
  "updateProduct",
  "deleteProduct",
  "updateCategory",
  "deleteCategory",
  "updateSupplier",
  "deleteSupplier",
  "updateStock",
]);

function normalizeArgsKey(args: unknown): string {
  if (!args || typeof args !== "object") return JSON.stringify(args ?? null);
  const entries = Object.entries(args as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return JSON.stringify(Object.fromEntries(entries));
}

function buildSensitiveActionSummary(toolName: string, args: unknown): string {
  return `${toolName} with ${JSON.stringify(args)}`;
}

const BARE_CONFIRMATION_MAX_LEN = 48;

function isBareConfirmationMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > BARE_CONFIRMATION_MAX_LEN) return false;
  return !/[.!?]/.test(trimmed);
}

function parseBareConfirmationReply(message: string): ConfirmationIntent {
  if (!isBareConfirmationMessage(message)) return null;

  const text = message.trim().toLowerCase();
  if (
    /\b(cancel|stop|abort|don'?t|do not|no|discard)\b/.test(text) &&
    !/\b(confirm|proceed)\b/.test(text)
  ) {
    return "cancel";
  }
  if (
    /\b(confirm|proceed|yes|yeah|yea|yep|ok|okay|go ahead|execute|do it)\b/.test(
      text,
    )
  ) {
    return "confirm";
  }
  return null;
}

function parseConfirmationIntent(
  message: string,
  hasPending: boolean,
): ConfirmationIntent {
  const text = message.trim().toLowerCase();
  if (!text) return null;

  if (hasPending) {
    if (
      /\b(cancel|stop|abort|don'?t|do not|no|discard)\b/.test(text) &&
      !/\b(confirm|proceed)\b/.test(text)
    ) {
      return "cancel";
    }
    if (
      /\b(confirm|proceed|yes|yeah|yea|yep|ok|okay|go ahead|execute|do it)\b/.test(
        text,
      )
    ) {
      return "confirm";
    }
    return null;
  }

  return parseBareConfirmationReply(message);
}

function buildPendingActionContext(pending: PendingSensitiveAction | null): string {
  if (!pending) {
    return [
      "## Sensitive Action Confirmation",
      "",
      "No pending sensitive action confirmation for this session.",
      "",
      "When approval is needed for a sensitive mutation you MUST call the relevant tool in that same turn (before your final reply) so StockMind can show the Confirm/Cancel control immediately.",
      "Never ask only in plain text without calling the tool — the popup is driven by the tool call, not by your wording alone.",
    ].join("\n");
  }
  return [
    "## Sensitive Action Confirmation",
    "",
    "A sensitive action is pending confirmation in this session:",
    `- ${pending.summary}`,
    "",
    "The StockMind UI is showing Confirm and Cancel buttons for the user right now.",
    "Rules:",
    "- Do NOT claim the action succeeded until the tool returns success after the user confirms.",
    "- Tell the user to use the Confirm or Cancel control below (they may also reply confirm/cancel/yes/no).",
    "- If the user confirms, call the same tool with the same arguments once.",
    "- If the user cancels, do not execute and acknowledge cancellation.",
  ].join("\n");
}

async function executeToolCalls(params: {
  toolCalls: AIMessage["tool_calls"];
  toolsByName: Map<string, ToolInvoker>;
  messages: BaseMessage[];
  sessionId: string;
  userId: string;
  userMessage: string;
  confirmationIntent: ConfirmationIntent;
  executedSensitiveKeys: Set<string>;
}): Promise<{ blockedForConfirmation: boolean; executedSensitive: boolean }> {
  const {
    toolCalls,
    toolsByName,
    messages,
    sessionId,
    userId,
    userMessage,
    confirmationIntent,
    executedSensitiveKeys,
  } = params;
  const bareConfirmationReply = parseBareConfirmationReply(userMessage);
  let blockedForConfirmation = false;
  let executedSensitive = false;

  for (const toolCall of toolCalls ?? []) {
    const tool = toolsByName.get(toolCall.name);
    const toolCallId = toolCall.id ?? `${toolCall.name}-${Date.now()}`;

    if (!tool) {
      messages.push(
        new ToolMessage({
          tool_call_id: toolCallId,
          content: `Tool "${toolCall.name}" is not available.`,
        }),
      );
      continue;
    }

    if (SENSITIVE_TOOLS.has(toolCall.name)) {
      const argsKey = normalizeArgsKey(toolCall.args);
      const sensitiveKey = `${toolCall.name}::${argsKey}`;
      const actionSummary = buildSensitiveActionSummary(toolCall.name, toolCall.args);

      if (executedSensitiveKeys.has(sensitiveKey)) {
        messages.push(
          new ToolMessage({
            tool_call_id: toolCallId,
            content: `Action already completed in this turn: ${actionSummary}.`,
          }),
        );
        continue;
      }

      const pending = await getPendingSensitiveAction(userId, sessionId);

      if (
        pending &&
        pending.userId === userId &&
        pending.toolName === toolCall.name &&
        pending.argsKey === argsKey
      ) {
        if (confirmationIntent === "cancel") {
          await clearPendingSensitiveAction(userId, sessionId);
          messages.push(
            new ToolMessage({
              tool_call_id: toolCallId,
              content: `Action cancelled by user. Cancelled: ${pending.summary}`,
            }),
          );
          continue;
        }
        if (confirmationIntent !== "confirm") {
          messages.push(
            new ToolMessage({
              tool_call_id: toolCallId,
              content: `Confirmation required. Pending action: ${pending.summary}. Ask user to reply with "confirm" or "cancel".`,
            }),
          );
          continue;
        }
        await clearPendingSensitiveAction(userId, sessionId);
      } else if (bareConfirmationReply === "cancel") {
        messages.push(
          new ToolMessage({
            tool_call_id: toolCallId,
            content: `Action cancelled by user. Did not execute: ${actionSummary}.`,
          }),
        );
        continue;
      } else if (bareConfirmationReply !== "confirm") {
        await setPendingSensitiveAction(userId, sessionId, {
          toolName: toolCall.name,
          argsKey,
          summary: actionSummary,
        });
        blockedForConfirmation = true;
        messages.push(
          new ToolMessage({
            tool_call_id: toolCallId,
            content: `Confirmation required before execution: ${actionSummary}. The UI Confirm/Cancel control is now visible. Do not claim success until the user confirms and this tool runs successfully.`,
          }),
        );
        continue;
      }
    }

    try {
      const toolResult = await tool.invoke(toolCall.args);
      if (SENSITIVE_TOOLS.has(toolCall.name)) {
        const argsKey = normalizeArgsKey(toolCall.args);
        executedSensitiveKeys.add(`${toolCall.name}::${argsKey}`);
        executedSensitive = true;
        await clearPendingSensitiveAction(userId, sessionId);
      }
      messages.push(
        new ToolMessage({
          tool_call_id: toolCallId,
          content:
            typeof toolResult === "string"
              ? toolResult
              : JSON.stringify(toolResult),
        }),
      );
    } catch (error) {
      messages.push(
        new ToolMessage({
          tool_call_id: toolCallId,
          content: `Tool execution error: ${asErrorMessage(error)}`,
        }),
      );
    }
  }

  return { blockedForConfirmation, executedSensitive };
}

async function runAgentLoop(params: {
  modelWithTools: ReturnType<ChatAnthropic["bindTools"]>;
  textModel: ChatAnthropic;
  messages: BaseMessage[];
  toolsByName: Map<string, ToolInvoker>;
  sessionId: string;
  userId: string;
  userMessage: string;
  confirmationIntent: ConfirmationIntent;
}): Promise<{ text: string; executedSensitive: boolean }> {
  const {
    modelWithTools,
    textModel,
    messages,
    toolsByName,
    sessionId,
    userId,
    userMessage,
    confirmationIntent,
  } = params;
  const executedSensitiveKeys = new Set<string>();
  let executedSensitive = false;

  for (let i = 0; i < MAX_TOOL_ROUNDS; i += 1) {
    const aiMessage = await modelWithTools.invoke(messages);
    messages.push(aiMessage);

    const toolCalls = aiMessage.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return { text: getAIText(aiMessage).trim(), executedSensitive };
    }

    const toolResult = await executeToolCalls({
      toolCalls,
      toolsByName,
      messages,
      sessionId,
      userId,
      userMessage,
      confirmationIntent,
      executedSensitiveKeys,
    });
    executedSensitive = executedSensitive || toolResult.executedSensitive;

    if (toolResult.blockedForConfirmation) {
      const summaryMessage = await textModel.invoke(messages);
      messages.push(summaryMessage);
      return { text: getAIText(summaryMessage).trim(), executedSensitive };
    }

    if (executedSensitive) {
      const summaryMessage = await textModel.invoke(messages);
      messages.push(summaryMessage);
      return { text: getAIText(summaryMessage).trim(), executedSensitive };
    }
  }

  return { text: "", executedSensitive };
}

function validatePayload(payload: unknown) {
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) return null;
  return parsed.data;
}

export async function POST(request: Request) {
  const contentTypeHeader = request.headers.get("content-type") ?? "";
  const isMultipart = contentTypeHeader.toLowerCase().includes("multipart/form-data");

  let sessionId = "";
  let messageRaw = "";
  let responseMode: "compact" | "detailed" = "detailed";
  let interactionMode: "text" | "voice" = "text";
  let attachmentFiles: File[] = [];

  if (isMultipart) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { message: "Invalid multipart body." },
        { status: 400 },
      );
    }

    sessionId = String(formData.get("sessionId") ?? "").trim();
    const msgField = formData.get("message");
    messageRaw = typeof msgField === "string" ? msgField : "";
    const rm = formData.get("responseMode");
    if (rm === "compact" || rm === "detailed") {
      responseMode = rm;
    }
    interactionMode = parseInteractionMode(formData.get("interactionMode"));

    if (!sessionId) {
      return NextResponse.json(
        { message: "Invalid payload. Expected sessionId (and optional message, files)." },
        { status: 400 },
      );
    }

    attachmentFiles = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const trimmedMultipartMsg = messageRaw.trim();
    if (!trimmedMultipartMsg && attachmentFiles.length === 0) {
      return NextResponse.json(
        {
          message:
            "Send a non-empty message or attach at least one allowed file (images, PDF, XLS/XLSX, DOCX).",
        },
        { status: 400 },
      );
    }
  } else {
    const payload = await request.json().catch(() => null);
    const validatedJson = validatePayload(payload);
    if (!validatedJson) {
      return NextResponse.json(
        { message: "Invalid payload. Expected sessionId and message." },
        { status: 400 },
      );
    }
    sessionId = validatedJson.sessionId;
    messageRaw = validatedJson.message;
    responseMode = validatedJson.responseMode ?? "detailed";
    interactionMode = validatedJson.interactionMode ?? "text";
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { message: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 },
    );
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!session.user.role) {
    return NextResponse.json(
      { message: "Unauthorized: missing role." },
      { status: 401 },
    );
  }
  try {
    const message = messageRaw.trim();
    const pendingBeforeTurn = await getPendingSensitiveAction(
      session.user.id,
      sessionId,
    );
    const confirmationIntent = parseConfirmationIntent(
      messageRaw.trim(),
      Boolean(pendingBeforeTurn),
    );

    let persistedHumanText: string;
    let humanMessage: HumanMessage;

    if (attachmentFiles.length > 0) {
      const prepared = await prepareChatAttachments(attachmentFiles, messageRaw);
      if (!prepared.ok) {
        return NextResponse.json({ message: prepared.message }, { status: 400 });
      }
      humanMessage = new HumanMessage({
        content: prepared.payload.langchainContent as HumanMessageFields["content"],
      });
      persistedHumanText = prepared.payload.persistedUserSummary;
    } else {
      humanMessage = new HumanMessage(message);
      persistedHumanText = message;
    }

    const permissions = getPermissionsForRole(session.user.role);
    let chatDownload: ChatDownloadOffer | null = null;
    const tools = getInventoryTools(
      {
        userId: session.user.id,
        role: session.user.role,
        userName: session.user.name,
        userEmail: session.user.email,
      },
      {
        onChatDownload: (download) => {
          chatDownload = download;
        },
      },
    );
    const toolsByName = new Map(
      tools.map((tool) => [
        tool.name,
        { invoke: (args: unknown) => (tool as ToolInvoker).invoke(args) },
      ]),
    );
    const anthropicConfig = {
      model: "claude-opus-4-6" as const,
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0,
      maxTokens: attachmentFiles.length > 0 ? 2048 : 1200,
    };
    const textModel = new ChatAnthropic(anthropicConfig);
    const modelWithTools = textModel.bindTools(tools);

    const history = await loadSessionHistory(session.user.id, sessionId);
    const runtimeSessionContext = buildRuntimeSessionContext({
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      role: session.user.role,
      permissions,
    });
    const pendingActionContext = buildPendingActionContext(pendingBeforeTurn);
    const responseStyleContract = buildResponseStyleContract(responseMode);
    const systemPrompt = buildSystemPromptSections({
      runtimeSessionContext,
      pendingActionContext,
      responseStyleContract,
      interactionMode,
    });
    const messages: BaseMessage[] = [new SystemMessage(systemPrompt), ...history];
    const userTurnIndex = messages.length;
    messages.push(humanMessage);

    const agentResult = await runAgentLoop({
      modelWithTools,
      textModel,
      messages,
      toolsByName,
      sessionId,
      userId: session.user.id,
      userMessage: message,
      confirmationIntent,
    });

    let finalText = agentResult.text;
    if (!finalText) {
      finalText =
        "I could not complete that request yet. Please clarify what inventory action you want.";
    }

    if (interactionMode === "voice") {
      finalText = sanitizeVoiceResponseText(finalText);
    }

    if (agentResult.executedSensitive) {
      await clearPendingSensitiveAction(session.user.id, sessionId);
    }

    const pendingAfterTurn = agentResult.executedSensitive
      ? null
      : await getPendingSensitiveAction(session.user.id, sessionId);

    const messagesForPersistence = sanitizeVoiceSessionMessages(
      [...messages],
      interactionMode,
    );
    messagesForPersistence[userTurnIndex] = new HumanMessage(persistedHumanText);
    await saveSessionHistory(
      session.user.id,
      sessionId,
      messagesForPersistence,
      CHAT_WINDOW_SIZE,
    );
    return NextResponse.json({
      message: finalText,
      pendingConfirmation: Boolean(pendingAfterTurn),
      pendingActionSummary: pendingAfterTurn?.summary ?? null,
      download: chatDownload,
    });
  } catch (error) {
    return NextResponse.json({ message: asErrorMessage(error) }, { status: 500 });
  }
}
