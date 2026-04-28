import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/server-access";
import {
  CategoryServiceError,
  toCategoryErrorMessage,
} from "@/server/categories/errors";
import {
  removeCategoryEntry,
  updateCategoryEntry,
} from "@/server/categories/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiPermission("UPDATE_CATEGORIES");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const payload = (await request.json()) as Record<string, unknown>;
    return NextResponse.json(await updateCategoryEntry(id, payload));
  } catch (error) {
    const status = error instanceof CategoryServiceError ? error.status : 500;
    return NextResponse.json({ message: toCategoryErrorMessage(error) }, { status });
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const auth = await requireApiPermission("MANAGE_CATEGORIES");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await removeCategoryEntry(id, auth.session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof CategoryServiceError ? error.status : 500;
    return NextResponse.json({ message: toCategoryErrorMessage(error) }, { status });
  }
}
