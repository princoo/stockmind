import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  NotificationServiceError,
  toNotificationErrorMessage,
} from "@/server/notifications/errors";
import { markNotificationsAsRead } from "@/server/notifications/service";

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    await markNotificationsAsRead(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof NotificationServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toNotificationErrorMessage(error) },
      { status },
    );
  }
}
