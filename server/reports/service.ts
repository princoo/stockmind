import type { Prisma } from "@/generated/prisma/client";
import type {
  ReportsQuery,
  ReportsResponse,
  StockSummaryRow,
  TransactionSummary,
} from "@/types/reports";
import { parseReportsQuery } from "@/server/reports/validation";
import {
  listFilteredProducts,
  listReportFilterOptions,
  listTransactionsForSummary,
} from "@/server/reports/reports-repository";

function startOfUtcDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function endOfUtcDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

function buildProductWhere(query: ReportsQuery): Prisma.ProductWhereInput {
  return {
    categoryId: query.categoryId,
    id: query.productId,
  };
}

function buildTransactionWhere(query: ReportsQuery): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {
    productId: query.productId,
    product: query.categoryId ? { categoryId: query.categoryId } : undefined,
  };
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      gte: query.dateFrom ? startOfUtcDay(query.dateFrom) : undefined,
      lte: query.dateTo ? endOfUtcDay(query.dateTo) : undefined,
    };
  }
  return where;
}

function buildStockSummaryRows(
  products: {
    category: { name: string };
    quantity: number;
    lowStockThreshold: number;
    price: Prisma.Decimal;
  }[],
): StockSummaryRow[] {
  const map = new Map<string, StockSummaryRow>();
  for (const p of products) {
    const key = p.category.name;
    const row = map.get(key) ?? {
      categoryName: key,
      productCount: 0,
      totalQuantity: 0,
      totalValue: 0,
      lowStockCount: 0,
    };
    row.productCount += 1;
    row.totalQuantity += p.quantity;
    row.totalValue += Number(p.price) * p.quantity;
    if (p.quantity <= p.lowStockThreshold) row.lowStockCount += 1;
    map.set(key, row);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName),
  );
}

function buildTransactionSummary(input: {
  groups: { type: "STOCK_IN" | "STOCK_OUT"; _count: { _all: number }; _sum: { quantity: number | null } }[];
  totalTransactions: number;
  recent: {
    id: string;
    createdAt: Date;
    type: "STOCK_IN" | "STOCK_OUT";
    quantity: number;
    product: { name: string; sku: string };
    user: { name: string };
  }[];
}): TransactionSummary {
  const stockIn = input.groups.find((g) => g.type === "STOCK_IN");
  const stockOut = input.groups.find((g) => g.type === "STOCK_OUT");
  const stockInQuantity = stockIn?._sum.quantity ?? 0;
  const stockOutQuantity = stockOut?._sum.quantity ?? 0;

  return {
    totalTransactions: input.totalTransactions,
    stockInCount: stockIn?._count._all ?? 0,
    stockInQuantity,
    stockOutCount: stockOut?._count._all ?? 0,
    stockOutQuantity,
    netQuantity: stockInQuantity - stockOutQuantity,
    recent: input.recent.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      type: r.type,
      quantity: r.quantity,
      productName: r.product.name,
      productSku: r.product.sku,
      userName: r.user.name,
    })),
  };
}

export async function getReportsData(
  rawQuery: Record<string, string>,
): Promise<ReportsResponse> {
  const query = parseReportsQuery(rawQuery);
  const productWhere = buildProductWhere(query);
  const transactionWhere = buildTransactionWhere(query);

  const [[categories, productsOptions], products, tx] = await Promise.all([
    listReportFilterOptions(),
    listFilteredProducts(productWhere),
    listTransactionsForSummary(transactionWhere, 10),
  ]);

  const lowStock = products
    .filter((p) => p.quantity <= p.lowStockThreshold)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      categoryName: p.category.name,
      quantity: p.quantity,
      lowStockThreshold: p.lowStockThreshold,
    }));

  return {
    filters: query,
    options: { categories, products: productsOptions },
    stockSummary: buildStockSummaryRows(products),
    lowStock,
    availableProducts: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      categoryName: p.category.name,
      quantity: p.quantity,
      unitPrice: Number(p.price),
      stockValue: Number(p.price) * p.quantity,
    })),
    transactionSummary: buildTransactionSummary(tx),
  };
}
