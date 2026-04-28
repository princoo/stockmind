import { prisma } from "@/lib/prisma";

export async function getSummaryCounts() {
  const [products, transactions] = await Promise.all([
    prisma.product.aggregate({
      _count: { _all: true },
      _sum: { quantity: true },
    }),
    prisma.transaction.count(),
  ]);

  return {
    totalProducts: products._count._all,
    totalStockQuantity: products._sum.quantity ?? 0,
    totalTransactions: transactions,
  };
}

export function getLowStockCount() {
  return prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "Product"
    WHERE quantity <= "lowStockThreshold"
  `;
}

export function getLowStockProducts(limit = 8) {
  return prisma.$queryRaw<
    {
      id: string;
      name: string;
      sku: string;
      quantity: number;
      lowStockThreshold: number;
    }[]
  >`
    SELECT id, name, sku, quantity, "lowStockThreshold"
    FROM "Product"
    WHERE quantity <= "lowStockThreshold"
    ORDER BY quantity ASC, "createdAt" DESC
    LIMIT ${limit}
  `;
}

export function getRecentTransactions(limit = 8) {
  return prisma.transaction.findMany({
    select: {
      id: true,
      type: true,
      quantity: true,
      createdAt: true,
      product: { select: { name: true, sku: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function getTransactionsSince(startDate: Date) {
  return prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      type: true,
      quantity: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
