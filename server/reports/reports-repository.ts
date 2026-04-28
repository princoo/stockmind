import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export function listReportFilterOptions() {
  return Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, sku: true, categoryId: true },
      orderBy: { name: "asc" },
    }),
  ]);
}

export function listFilteredProducts(where: Prisma.ProductWhereInput) {
  return prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      lowStockThreshold: true,
      price: true,
      category: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function listTransactionsForSummary(
  where: Prisma.TransactionWhereInput,
  recentTake = 10,
) {
  const [groups, totalTransactions, recent] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where,
      _count: { _all: true },
      _sum: { quantity: true },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      take: recentTake,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        type: true,
        quantity: true,
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  return { groups, totalTransactions, recent };
}
