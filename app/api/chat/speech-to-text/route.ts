import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { transcribeAudioWithDeepgram } from "@/server/ai/speech-input";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof File)) {
      return NextResponse.json(
        { message: "No audio file uploaded." },
        { status: 400 },
      );
    }

    const contentType = audio.type || "application/octet-stream";
    const bytes = Buffer.from(await audio.arrayBuffer());
    if (bytes.byteLength === 0) {
      return NextResponse.json(
        { message: "Uploaded audio file is empty." },
        { status: 400 },
      );
    }

    const transcript = await transcribeAudioWithDeepgram(bytes, contentType);
    return NextResponse.json({ transcript });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Speech-to-text transcription failed.",
      },
      { status: 500 },
    );
  }
}
