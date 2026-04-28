import {
  countCategoryProducts,
  createCategory,
  deleteCategory,
  deleteCategoryWithAudit,
  findCategoryById,
  findCategoryByName,
  listCategories,
  updateCategory,
} from "@/server/categories/category-repository";
import { CategoryServiceError } from "@/server/categories/errors";
import {
  parseCategorySearch,
  validateCategoryPayload,
} from "@/server/categories/validation";
import { notifyAdminsBestEffort } from "@/server/notifications/service";

export async function getCategories(rawQuery: Record<string, string>) {
  const search = parseCategorySearch(rawQuery);
  const rows = await listCategories(search);
  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
      productCount: r._count.products,
    })),
  };
}

export async function createCategoryEntry(payload: Record<string, unknown>) {
  const parsed = validateCategoryPayload(payload);
  await ensureNameUnique(parsed.name);
  return createCategory(parsed.name, parsed.description);
}

export async function updateCategoryEntry(
  id: string,
  payload: Record<string, unknown>,
) {
  const parsed = validateCategoryPayload(payload);
  const current = await findCategoryById(id);
  if (!current) throw new CategoryServiceError("Category not found.", 404);
  if (current.name.toLowerCase() !== parsed.name.toLowerCase()) {
    await ensureNameUnique(parsed.name);
  }
  return updateCategory(id, parsed.name, parsed.description);
}

export async function removeCategoryEntry(id: string, userId?: string) {
  const current = await findCategoryById(id);
  if (!current) throw new CategoryServiceError("Category not found.", 404);
  const linkedProducts = await countCategoryProducts(id);
  if (linkedProducts > 0) {
    throw new CategoryServiceError(
      "Cannot delete category linked to products.",
      409,
    );
  }
  const deleted = userId
    ? await deleteCategoryWithAudit(id, userId)
    : await deleteCategory(id);
  if (userId) {
    await notifyAdminsBestEffort({
      type: "ALERT",
      message: `Category deleted: ${current.name}.`,
      entityType: "CATEGORY",
      entityId: deleted.id,
      href: "/categories",
    });
  }
  return deleted;
}

async function ensureNameUnique(name: string) {
  if (await findCategoryByName(name)) {
    throw new CategoryServiceError("Category name already exists.", 409);
  }
}
