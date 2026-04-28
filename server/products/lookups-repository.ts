import { prisma } from "@/lib/prisma";

export function listCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export function listSuppliers() {
  return prisma.supplier.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function checkCategorySupplier(
  categoryId: string,
  supplierId: string,
) {
  const [category, supplier] = await Promise.all([
    prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }),
    prisma.supplier.findUnique({ where: { id: supplierId }, select: { id: true } }),
  ]);
  return { categoryExists: Boolean(category), supplierExists: Boolean(supplier) };
}
