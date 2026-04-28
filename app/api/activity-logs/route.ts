import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import {
  ActivityLogServiceError,
  toActivityLogErrorMessage,
} from "@/server/activity-logs/errors";
import { getActivityLogs } from "@/server/activity-logs/service";

export async function GET(request: Request) {
  const auth = await requireApiPermission("VIEW_ACTIVITY_LOGS");
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const result = await getActivityLogs(query);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ActivityLogServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toActivityLogErrorMessage(error) },
      { status },
    );
  }
}
