import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { consumeChatDownload } from "@/server/ai/chat-downloads";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { token } = await context.params;
  const trimmed = token?.trim();
  if (!trimmed) {
    return NextResponse.json({ message: "Invalid download token." }, { status: 400 });
  }

  const download = consumeChatDownload(trimmed, session.user.id);
  if (!download) {
    return NextResponse.json(
      { message: "Download link is invalid or has expired." },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(download.buffer), {
    status: 200,
    headers: {
      "Content-Type": download.mimeType,
      "Content-Disposition": `attachment; filename="${download.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
