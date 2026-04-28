import type { TransactionType } from "@/generated/prisma/enums";

export type ReportsQuery = {
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  categoryId?: string;
};

export type ReportFilterOptions = {
  products: { id: string; name: string; sku: string; categoryId: string }[];
  categories: { id: string; name: string }[];
};

export type StockSummaryRow = {
  categoryName: string;
  productCount: number;
  totalQuantity: number;
  totalValue: number;
  lowStockCount: number;
};

export type LowStockReportRow = {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  quantity: number;
  lowStockThreshold: number;
};

export type AvailableProductRow = {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  stockValue: number;
};

export type TransactionSummary = {
  totalTransactions: number;
  stockInCount: number;
  stockInQuantity: number;
  stockOutCount: number;
  stockOutQuantity: number;
  netQuantity: number;
  recent: {
    id: string;
    createdAt: string;
    type: TransactionType;
    quantity: number;
    productName: string;
    productSku: string;
    userName: string;
  }[];
};

export type ReportsResponse = {
  filters: ReportsQuery;
  options: ReportFilterOptions;
  stockSummary: StockSummaryRow[];
  lowStock: LowStockReportRow[];
  transactionSummary: TransactionSummary;
  availableProducts: AvailableProductRow[];
};
