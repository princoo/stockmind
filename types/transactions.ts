import type { TransactionType } from "@/generated/prisma/enums";

export type TransactionListItem = {
  id: string;
  type: TransactionType;
  quantity: number;
  createdAt: string;
  productId: string;
  productName: string;
  productSku: string;
  userId: string;
  userName: string;
  userEmail: string;
};

export type TransactionListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  sortBy: "createdAt" | "quantity";
  sortDir: "asc" | "desc";
};

export type TransactionListResult = {
  items: TransactionListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
