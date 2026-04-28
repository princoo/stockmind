import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ensureRealtimeServer } from "@/lib/realtime/socket-server";

export const runtime = "nodejs";

function buildSocketUrl(request: Request, port: number) {
  const source = new URL(request.url);
  return `${source.protocol}//${source.hostname}:${port}`;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { port } = await ensureRealtimeServer();
    return NextResponse.json({ ok: true, url: buildSocketUrl(request, port) });
  } catch {
    return NextResponse.json({ message: "Failed to initialize realtime server." }, { status: 500 });
  }
}
