const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

export type ElevenLabsSynthesizeOptions = {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
};

export type ElevenLabsSynthesizeResult = {
  audio: ArrayBuffer;
  contentType: string;
};

function getVoiceId(override?: string): string {
  const voiceId =
    override?.trim() ||
    process.env.ELEVENLABS_VOICE_ID?.trim() ||
    "EXAVITQu4vr4xnSDxMaL";
  return voiceId;
}

function getModelId(override?: string): string {
  return (
    override?.trim() ||
    process.env.ELEVENLABS_MODEL_ID?.trim() ||
    "eleven_turbo_v2_5"
  );
}

export async function synthesizeWithElevenLabs(
  options: ElevenLabsSynthesizeOptions,
): Promise<ElevenLabsSynthesizeResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  const text = options.text.trim();
  if (!text) {
    throw new Error("Text is required for speech synthesis.");
  }

  const voiceId = getVoiceId(options.voiceId);
  const modelId = getModelId(options.modelId);
  const stability = options.stability ?? 0.45;
  const similarityBoost = options.similarityBoost ?? 0.78;

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `ElevenLabs synthesis failed (${response.status}): ${details.slice(0, 240)}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "audio/mpeg";
  const audio = await response.arrayBuffer();
  if (audio.byteLength === 0) {
    throw new Error("ElevenLabs returned empty audio.");
  }

  return { audio, contentType };
}
