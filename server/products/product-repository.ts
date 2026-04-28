import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductListQuery, ProductPayload } from "@/types/products";

function buildWhere(query: ProductListQuery): Prisma.ProductWhereInput {
  const search = query.search
    ? [
        { name: { contains: query.search, mode: "insensitive" as const } },
        { sku: { contains: query.search, mode: "insensitive" as const } },
      ]
    : undefined;
  return { categoryId: query.categoryId, OR: search };
}

export async function listProducts(query: ProductListQuery) {
  const where = buildWhere(query);
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, supplier: true },
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  return { rows, total };
}

export function findProductBySku(sku: string) {
  return prisma.product.findUnique({ where: { sku } });
}

export function findProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export function createProduct(data: ProductPayload) {
  return prisma.product.create({ data });
}

export function createProductWithAudit(data: ProductPayload, userId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data });
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "PRODUCT",
        entityId: product.id,
        userId,
      },
    });
    return product;
  });
}

export function updateProduct(
  id: string,
  data: {
    name: string;
    sku: string;
    price: number;
    lowStockThreshold: number;
    categoryId: string;
    supplierId: string;
  },
) {
  return prisma.product.update({ where: { id }, data });
}

export function updateProductWithAudit(
  id: string,
  data: {
    name: string;
    sku: string;
    price: number;
    lowStockThreshold: number;
    categoryId: string;
    supplierId: string;
  },
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({ where: { id }, data });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "PRODUCT",
        entityId: product.id,
        userId,
      },
    });
    return product;
  });
}

export function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

export function deleteProductWithAudit(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entity: "PRODUCT",
        entityId: product.id,
        userId,
      },
    });
    return product;
  });
}
