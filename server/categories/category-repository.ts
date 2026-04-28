import { prisma } from "@/lib/prisma";

export function listCategories(search?: string) {
  return prisma.category.findMany({
    where: search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : undefined,
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function findCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export function findCategoryByName(name: string) {
  return prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" as const } },
  });
}

export function createCategory(name: string, description: string) {
  return prisma.category.create({ data: { name, description } });
}

export function updateCategory(id: string, name: string, description: string) {
  return prisma.category.update({ where: { id }, data: { name, description } });
}

export function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}

export function deleteCategoryWithAudit(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const category = await tx.category.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entity: "CATEGORY",
        entityId: category.id,
        userId,
      },
    });
    return category;
  });
}

export function countCategoryProducts(id: string) {
  return prisma.product.count({ where: { categoryId: id } });
}
