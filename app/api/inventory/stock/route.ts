import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import {
  InventoryServiceError,
  toInventoryErrorMessage,
} from "@/server/inventory/errors";
import { recordStockMovement } from "@/server/inventory/service";

export async function POST(request: Request) {
  const auth = await requireApiPermission("OPERATE_STOCK");
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await recordStockMovement(auth.session.user.id, payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status =
      error instanceof InventoryServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toInventoryErrorMessage(error) },
      { status },
    );
  }
}
