import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import { ProductServiceError, toErrorMessage } from "@/server/products/errors";
import {
  removeProductEntry,
  updateProductEntry,
} from "@/server/products/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiPermission("MANAGE_PRODUCTS");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await updateProductEntry(id, payload, auth.session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ProductServiceError ? error.status : 500;
    return NextResponse.json({ message: toErrorMessage(error) }, { status });
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const auth = await requireApiPermission("DELETE_PRODUCTS");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await removeProductEntry(id, auth.session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof ProductServiceError ? error.status : 500;
    return NextResponse.json({ message: toErrorMessage(error) }, { status });
  }
}
