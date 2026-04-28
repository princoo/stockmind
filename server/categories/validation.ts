import { CategoryServiceError } from "@/server/categories/errors";
import type { CategoryPayload } from "@/types/categories";

export function parseCategorySearch(input: Record<string, string>) {
  return input.search?.trim() || undefined;
}

export function validateCategoryPayload(
  payload: Partial<CategoryPayload>,
): CategoryPayload {
  const name = payload.name?.trim();
  const description = payload.description?.trim() ?? "";
  if (!name) throw new CategoryServiceError("Category name is required.");
  return { name, description };
}
