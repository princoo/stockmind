import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import { getDashboardData } from "@/server/dashboard/service";
import {
  DashboardServiceError,
  toDashboardErrorMessage,
} from "@/server/dashboard/errors";

export async function GET() {
  const auth = await requireApiPermission("VIEW_DASHBOARD");
  if (!auth.ok) return auth.response;

  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof DashboardServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toDashboardErrorMessage(error) },
      { status },
    );
  }
}
