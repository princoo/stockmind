import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  NotificationServiceError,
  toNotificationErrorMessage,
} from "@/server/notifications/errors";
import { getNotifications } from "@/server/notifications/service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const limitRaw = Number(new URL(request.url).searchParams.get("limit") ?? "8");
    const data = await getNotifications(session.user.id, limitRaw);
    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof NotificationServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toNotificationErrorMessage(error) },
      { status },
    );
  }
}
