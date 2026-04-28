import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import { ProductServiceError, toErrorMessage } from "@/server/products/errors";
import {
  createProductEntry,
  getProducts,
  getProductsWithOptions,
} from "@/server/products/service";

export async function GET(request: Request) {
  const auth = await requireApiPermission("VIEW_PRODUCTS");
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const includeOptions = url.searchParams.get("includeOptions") === "1";
    const result = includeOptions
      ? await getProductsWithOptions(query)
      : await getProducts(query);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ProductServiceError ? error.status : 500;
    return NextResponse.json({ message: toErrorMessage(error) }, { status });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("MANAGE_PRODUCTS");
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await createProductEntry(payload, auth.session.user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof ProductServiceError ? error.status : 500;
    return NextResponse.json({ message: toErrorMessage(error) }, { status });
  }
}
