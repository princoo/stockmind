type DeepgramResponse = {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
      }>;
    }>;
  };
};

function extractTranscript(payload: DeepgramResponse): string {
  const transcript =
    payload.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  return transcript.trim();
}

export async function transcribeAudioWithDeepgram(
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is not configured.");
  }

  const deepgramResponse = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&language=multi",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": contentType || "application/octet-stream",
      },
      body: new Uint8Array(bytes),
    },
  );

  if (!deepgramResponse.ok) {
    const details = await deepgramResponse.text();
    console.log(details)
    throw new Error(
      `Deepgram transcription failed (${deepgramResponse.status}): ${details.slice(0, 240)}`,
    );
  }

  const payload = (await deepgramResponse.json()) as DeepgramResponse;
  return extractTranscript(payload);
}
