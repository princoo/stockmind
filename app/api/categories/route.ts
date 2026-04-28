import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import {
  CategoryServiceError,
  toCategoryErrorMessage,
} from "@/server/categories/errors";
import {
  createCategoryEntry,
  getCategories,
} from "@/server/categories/service";

export async function GET(request: Request) {
  const auth = await requireApiPermission("VIEW_CATEGORIES");
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    return NextResponse.json(await getCategories(query));
  } catch (error) {
    const status = error instanceof CategoryServiceError ? error.status : 500;
    return NextResponse.json({ message: toCategoryErrorMessage(error) }, { status });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("MANAGE_CATEGORIES");
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    return NextResponse.json(await createCategoryEntry(payload), { status: 201 });
  } catch (error) {
    const status = error instanceof CategoryServiceError ? error.status : 500;
    return NextResponse.json({ message: toCategoryErrorMessage(error) }, { status });
  }
}
