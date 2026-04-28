import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import { toErrorMessage } from "@/server/products/errors";
import { getProductFormOptions } from "@/server/products/service";

export async function GET() {
  const auth = await requireApiPermission("MANAGE_PRODUCTS");
  if (!auth.ok) return auth.response;

  try {
    const result = await getProductFormOptions();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: toErrorMessage(error) }, { status: 500 });
  }
}
