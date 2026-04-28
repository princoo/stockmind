import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import {
  SupplierServiceError,
  toSupplierErrorMessage,
} from "@/server/suppliers/errors";
import {
  removeSupplierEntry,
  updateSupplierEntry,
} from "@/server/suppliers/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiPermission("MANAGE_SUPPLIERS");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const payload = (await request.json()) as Record<string, unknown>;
    return NextResponse.json(await updateSupplierEntry(id, payload));
  } catch (error) {
    const status = error instanceof SupplierServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toSupplierErrorMessage(error) },
      { status },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const auth = await requireApiPermission("MANAGE_SUPPLIERS");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await removeSupplierEntry(id, auth.session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof SupplierServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toSupplierErrorMessage(error) },
      { status },
    );
  }
}
