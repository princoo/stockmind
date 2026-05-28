import type { InteractionMode } from "@/lib/chat-interaction-mode";

export type StockPilotResponseMode = "compact" | "detailed";

export type StockPilotChatResult = {
  reply: string;
  pendingConfirmation: boolean;
  pendingActionSummary: string | null;
};

export async function postStockPilotChat(params: {
  sessionId: string;
  message: string;
  responseMode: StockPilotResponseMode;
  interactionMode: InteractionMode;
}): Promise<StockPilotChatResult> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: params.sessionId,
      message: params.message,
      responseMode: params.responseMode,
      interactionMode: params.interactionMode,
    }),
  });

  const data = (await response.json()) as {
    /** Assistant reply text (primary field from `/api/chat`) */
    message?: string;
    reply?: string;
    pendingConfirmation?: boolean;
    pendingActionSummary?: string | null;
    /** Error payload when `response.ok` is false */
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.message ?? data.error ?? `Chat request failed (${response.status})`,
    );
  }

  const reply = (data.message ?? data.reply ?? "").trim();

  return {
    reply,
    pendingConfirmation: Boolean(data.pendingConfirmation),
    pendingActionSummary: data.pendingActionSummary ?? null,
  };
}

export async function transcribeVoiceAudio(audioBlob: Blob): Promise<string> {
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
    throw new Error("Could not understand input");
  }

  return transcript;
}

export async function synthesizeVoiceResponse(text: string): Promise<Blob> {
  const response = await fetch("/api/chat/text-to-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Speech synthesis failed (${response.status})`);
  }

  return response.blob();
}
