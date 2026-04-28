import type {
  ProductListResult,
  ProductPayload,
  ProductStatus,
} from "@/types/products";
import { ProductServiceError } from "@/server/products/errors";
import {
  parseListQuery,
  validateProductPayload,
} from "@/server/products/validation";
import {
  createProduct,
  createProductWithAudit,
  deleteProduct,
  deleteProductWithAudit,
  findProductById,
  findProductBySku,
  listProducts,
  updateProduct,
  updateProductWithAudit,
} from "@/server/products/product-repository";
import {
  checkCategorySupplier,
  listCategories,
  listSuppliers,
} from "@/server/products/lookups-repository";
import { notifyAdminsBestEffort } from "@/server/notifications/service";

export async function getProducts(
  rawQuery: Record<string, string>,
): Promise<ProductListResult> {
  const query = parseListQuery(rawQuery);
  const { rows, total } = await listProducts(query);
  const items = rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    categoryId: row.categoryId,
    categoryName: row.category.name,
    supplierId: row.supplierId,
    supplierName: row.supplier.name,
    price: Number(row.price),
    quantity: row.quantity,
    lowStockThreshold: row.lowStockThreshold,
    status: getStatus(row.quantity, row.lowStockThreshold),
  }));
  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}

export async function createProductEntry(
  payload: Partial<ProductPayload>,
  userId?: string,
) {
  const parsed = validateProductPayload(payload);
  await ensureSkuUnique(parsed.sku);
  await ensureRelations(parsed.categoryId, parsed.supplierId);
  if (userId) return createProductWithAudit(parsed, userId);
  return createProduct(parsed);
}

export async function updateProductEntry(
  id: string,
  payload: Partial<ProductPayload>,
  userId?: string,
) {
  const parsed = validateProductPayload(payload);
  const current = await findProductById(id);
  if (!current) throw new ProductServiceError("Product not found.", 404);
  if (parsed.quantity !== current.quantity) {
    throw new ProductServiceError("Quantity can only change via transactions.");
  }
  if (parsed.sku !== current.sku) await ensureSkuUnique(parsed.sku);
  await ensureRelations(parsed.categoryId, parsed.supplierId);
  const data = {
    name: parsed.name,
    sku: parsed.sku,
    price: parsed.price,
    lowStockThreshold: parsed.lowStockThreshold,
    categoryId: parsed.categoryId,
    supplierId: parsed.supplierId,
  };
  if (userId) return updateProductWithAudit(id, data, userId);
  return updateProduct(id, data);
}

export async function removeProductEntry(id: string, userId?: string) {
  const current = await findProductById(id);
  if (!current) throw new ProductServiceError("Product not found.", 404);
  const deleted = userId
    ? await deleteProductWithAudit(id, userId)
    : await deleteProduct(id);
  if (userId) {
    await notifyAdminsBestEffort({
      type: "ALERT",
      message: `Product deleted: ${current.name} (${current.sku}).`,
      entityType: "PRODUCT",
      entityId: deleted.id,
      href: "/products",
    });
  }
  return deleted;
}

export async function getProductFormOptions() {
  const [categories, suppliers] = await Promise.all([
    listCategories(),
    listSuppliers(),
  ]);
  return { categories, suppliers };
}

export async function getProductsWithOptions(rawQuery: Record<string, string>) {
  const [list, options] = await Promise.all([
    getProducts(rawQuery),
    getProductFormOptions(),
  ]);
  return { ...list, options };
}

async function ensureSkuUnique(sku: string) {
  if (await findProductBySku(sku))
    throw new ProductServiceError("SKU already exists.", 409);
}

async function ensureRelations(categoryId: string, supplierId: string) {
  const relation = await checkCategorySupplier(categoryId, supplierId);
  if (!relation.categoryExists)
    throw new ProductServiceError("Category not found.", 400);
  if (!relation.supplierExists)
    throw new ProductServiceError("Supplier not found.", 400);
}

function getStatus(quantity: number, threshold: number): ProductStatus {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= threshold) return "LOW_STOCK";
  return "IN_STOCK";
}
