import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import { getReportsData } from "@/server/reports/service";
import {
  ReportsServiceError,
  toReportsErrorMessage,
} from "@/server/reports/errors";

export async function GET(request: Request) {
  const auth = await requireApiPermission("VIEW_REPORTS");
  if (!auth.ok) return auth.response;

  try {
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const data = await getReportsData(query);
    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ReportsServiceError ? error.status : 500;
    return NextResponse.json({ message: toReportsErrorMessage(error) }, { status });
  }
}
