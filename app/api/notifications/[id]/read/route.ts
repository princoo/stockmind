import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  NotificationServiceError,
  toNotificationErrorMessage,
} from "@/server/notifications/errors";
import { markNotificationAsRead } from "@/server/notifications/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(_: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    await markNotificationAsRead(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof NotificationServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toNotificationErrorMessage(error) },
      { status },
    );
  }
}
