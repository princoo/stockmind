import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { synthesizeWithElevenLabs } from "@/server/ai/speech-output";

const MAX_TTS_CHARS = 4_000;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { text?: string };
    const text = (body.text ?? "").trim();
    if (!text) {
      return NextResponse.json(
        { message: "Text is required for speech synthesis." },
        { status: 400 },
      );
    }
    if (text.length > MAX_TTS_CHARS) {
      return NextResponse.json(
        {
          message: `Text exceeds maximum length of ${MAX_TTS_CHARS} characters.`,
        },
        { status: 400 },
      );
    }

    const { audio, contentType } = await synthesizeWithElevenLabs({ text });

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Text-to-speech failed.";
    const status = message.includes("not configured") ? 500 : 502;
    return NextResponse.json({ message }, { status });
  }
}
