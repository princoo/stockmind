import type { ProductListQuery, ProductPayload } from "@/types/products";
import { ProductServiceError } from "@/server/products/errors";

const sortBySet = new Set(["name", "price", "quantity", "createdAt"]);
const sortDirSet = new Set(["asc", "desc"]);

export function parseListQuery(input: Record<string, string>): ProductListQuery {
  const page = Math.max(Number(input.page || "1"), 1);
  const pageSize = Math.min(Math.max(Number(input.pageSize || "5"), 1), 50);
  const sortBy = sortBySet.has(input.sortBy) ? input.sortBy : "createdAt";
  const sortDir = sortDirSet.has(input.sortDir) ? input.sortDir : "desc";
  return {
    page,
    pageSize,
    search: input.search?.trim() || undefined,
    categoryId: input.categoryId?.trim() || undefined,
    sortBy: sortBy as ProductListQuery["sortBy"],
    sortDir: sortDir as ProductListQuery["sortDir"],
  };
}

export function validateProductPayload(
  payload: Partial<ProductPayload>,
): ProductPayload {
  const name = payload.name?.trim();
  const sku = payload.sku?.trim().toUpperCase();
  const price = Number(payload.price);
  const quantity = Math.max(Number(payload.quantity), 0);
  const lowStockThreshold = Math.max(Number(payload.lowStockThreshold), 0);
  const categoryId = payload.categoryId?.trim();
  const supplierId = payload.supplierId?.trim();

  if (!name || !sku || !categoryId || !supplierId) {
    throw new ProductServiceError("Name, SKU, category and supplier are required.");
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new ProductServiceError("Price must be greater than zero.");
  }
  if (!Number.isInteger(quantity) || !Number.isInteger(lowStockThreshold)) {
    throw new ProductServiceError("Quantity and threshold must be whole numbers.");
  }

  return { name, sku, price, quantity, lowStockThreshold, categoryId, supplierId };
}
