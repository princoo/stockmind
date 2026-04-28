import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import {
  InventoryServiceError,
  toInventoryErrorMessage,
} from "@/server/inventory/errors";
import { getInventorySummary } from "@/server/inventory/service";

export async function GET() {
  const auth = await requireApiPermission("VIEW_INVENTORY");
  if (!auth.ok) return auth.response;

  try {
    const summary = await getInventorySummary();
    return NextResponse.json(summary);
  } catch (error) {
    const status =
      error instanceof InventoryServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toInventoryErrorMessage(error) },
      { status },
    );
  }
}
