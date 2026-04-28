import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import {
  SupplierServiceError,
  toSupplierErrorMessage,
} from "@/server/suppliers/errors";
import {
  createSupplierEntry,
  getSuppliers,
} from "@/server/suppliers/service";

export async function GET(request: Request) {
  const auth = await requireApiPermission("VIEW_SUPPLIERS");
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    return NextResponse.json(await getSuppliers(query));
  } catch (error) {
    const status = error instanceof SupplierServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toSupplierErrorMessage(error) },
      { status },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("MANAGE_SUPPLIERS");
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await createSupplierEntry(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof SupplierServiceError ? error.status : 500;
    return NextResponse.json(
      { message: toSupplierErrorMessage(error) },
      { status },
    );
  }
}
