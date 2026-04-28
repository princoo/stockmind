import type { DashboardData, DashboardStockTrendPoint } from "@/types/dashboard";
import {
  getLowStockCount,
  getLowStockProducts,
  getRecentTransactions,
  getSummaryCounts,
  getTransactionsSince,
} from "@/server/dashboard/dashboard-repository";

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildStockTrend(
  rows: { type: "STOCK_IN" | "STOCK_OUT"; quantity: number; createdAt: Date }[],
  days: number,
): DashboardStockTrendPoint[] {
  const today = new Date();
  const byDay = new Map<string, { stockIn: number; stockOut: number }>();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    byDay.set(utcDateKey(d), { stockIn: 0, stockOut: 0 });
  }

  for (const row of rows) {
    const key = utcDateKey(row.createdAt);
    const day = byDay.get(key);
    if (!day) continue;
    if (row.type === "STOCK_IN") day.stockIn += row.quantity;
    else day.stockOut += row.quantity;
  }

  return Array.from(byDay.entries()).map(([date, val]) => ({
    date,
    stockIn: val.stockIn,
    stockOut: val.stockOut,
    net: val.stockIn - val.stockOut,
  }));
}

export async function getDashboardData(): Promise<DashboardData> {
  const trendStart = new Date();
  trendStart.setUTCDate(trendStart.getUTCDate() - 29);
  trendStart.setUTCHours(0, 0, 0, 0);

  const [summaryCounts, lowStockCountRows, lowStockProducts, recentTransactions, trendRows] =
    await Promise.all([
      getSummaryCounts(),
      getLowStockCount(),
      getLowStockProducts(8),
      getRecentTransactions(8),
      getTransactionsSince(trendStart),
    ]);

  const lowStockItemsCount = Number(lowStockCountRows[0]?.count ?? 0);

  return {
    summary: {
      totalProducts: summaryCounts.totalProducts,
      totalStockQuantity: summaryCounts.totalStockQuantity,
      lowStockItemsCount,
      totalTransactions: summaryCounts.totalTransactions,
    },
    lowStockProducts,
    recentTransactions: recentTransactions.map((row) => ({
      id: row.id,
      type: row.type,
      quantity: row.quantity,
      createdAt: row.createdAt.toISOString(),
      productName: row.product.name,
      productSku: row.product.sku,
      userName: row.user.name,
    })),
    stockTrend: buildStockTrend(
      trendRows.map((row) => ({
        type: row.type as "STOCK_IN" | "STOCK_OUT",
        quantity: row.quantity,
        createdAt: row.createdAt,
      })),
      30,
    ),
  };
}
