import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { loadSessionTranscript } from "@/server/ai/chat-memory-store";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { message: "sessionId query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const messages = await loadSessionTranscript(session.user.id, sessionId);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load chat history.",
      },
      { status: 500 },
    );
  }
}
