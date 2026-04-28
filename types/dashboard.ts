import type { TransactionType } from "@/generated/prisma/enums";

export type DashboardSummary = {
  totalProducts: number;
  totalStockQuantity: number;
  lowStockItemsCount: number;
  totalTransactions: number;
};

export type DashboardRecentTransaction = {
  id: string;
  type: TransactionType;
  quantity: number;
  createdAt: string;
  productName: string;
  productSku: string;
  userName: string;
};

export type DashboardLowStockProduct = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
};

export type DashboardStockTrendPoint = {
  date: string;
  stockIn: number;
  stockOut: number;
  net: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  recentTransactions: DashboardRecentTransaction[];
  lowStockProducts: DashboardLowStockProduct[];
  stockTrend: DashboardStockTrendPoint[];
};
