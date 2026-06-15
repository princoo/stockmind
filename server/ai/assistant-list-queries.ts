import type { Prisma } from "@/generated/prisma/client";
import { listProducts } from "@/server/products/product-repository";
import { listSuppliers } from "@/server/suppliers/supplier-repository";
import { listTransactions } from "@/server/transactions/transaction-repository";
import { listActivityLogs } from "@/server/activity-logs/activity-log-repository";
import { listNotificationsForUser } from "@/server/notifications/notification-repository";
import { prisma } from "@/lib/prisma";
import { AI_TOOL_LIST_MAX_ROWS } from "@/server/ai/tool-list-response";

function resolveStockStatus(quantity: number, lowStockThreshold: number) {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

function startOfUtcDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function endOfUtcDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

export async function fetchInventoryProductsForAssistant(input: {
  productId?: string;
  sku?: string;
  search?: string;
  availability?: "ALL" | "AVAILABLE";
}) {
  const where: Prisma.ProductWhereInput = {};
  if (input.productId) where.id = input.productId;
  else if (input.sku) where.sku = input.sku;
  else if (input.search) {
    where.OR = [
      { name: { contains: input.search, mode: "insensitive" } },
      { sku: { contains: input.search, mode: "insensitive" } },
    ];
  }
  if (input.availability === "AVAILABLE") where.quantity = { gt: 0 };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        lowStockThreshold: true,
        price: true,
        category: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      take: AI_TOOL_LIST_MAX_ROWS,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
      status: resolveStockStatus(item.quantity, item.lowStockThreshold),
      price: Number(item.price),
      category: item.category.name,
      supplier: item.supplier.name,
    })),
    total,
  };
}

export async function fetchProductsForAssistant(input: {
  search?: string;
  categoryId?: string;
  sortBy?: "name" | "price" | "quantity" | "createdAt";
  sortDir?: "asc" | "desc";
}) {
  const { rows, total } = await listProducts({
    page: 1,
    pageSize: AI_TOOL_LIST_MAX_ROWS,
    search: input.search,
    categoryId: input.categoryId,
    sortBy: input.sortBy ?? "createdAt",
    sortDir: input.sortDir ?? "desc",
  });

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      categoryId: row.categoryId,
      categoryName: row.category.name,
      supplierId: row.supplierId,
      supplierName: row.supplier.name,
      price: Number(row.price),
      quantity: row.quantity,
      lowStockThreshold: row.lowStockThreshold,
      status: resolveStockStatus(row.quantity, row.lowStockThreshold),
    })),
    total,
  };
}

export async function fetchSuppliersForAssistant(input: {
  search?: string;
  sortBy?: "name" | "createdAt";
  sortDir?: "asc" | "desc";
}) {
  const { rows, total } = await listSuppliers({
    page: 1,
    pageSize: AI_TOOL_LIST_MAX_ROWS,
    search: input.search,
    sortBy: input.sortBy ?? "createdAt",
    sortDir: input.sortDir ?? "desc",
  });

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contactPerson ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      status: row.isActive ? "ACTIVE" : "INACTIVE",
      productCount: row._count.products,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
  };
}

function buildTransactionWhere(input: {
  search?: string;
  type?: "STOCK_IN" | "STOCK_OUT";
  dateFrom?: string;
  dateTo?: string;
}): Prisma.TransactionWhereInput {
  const parts: Prisma.TransactionWhereInput[] = [];

  if (input.search) {
    parts.push({
      product: {
        name: { contains: input.search, mode: "insensitive" },
      },
    });
  }
  if (input.type) parts.push({ type: input.type });
  if (input.dateFrom || input.dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (input.dateFrom) range.gte = startOfUtcDay(input.dateFrom);
    if (input.dateTo) range.lte = endOfUtcDay(input.dateTo);
    parts.push({ createdAt: range });
  }

  return parts.length ? { AND: parts } : {};
}

export async function fetchTransactionsForAssistant(input: {
  search?: string;
  type?: "STOCK_IN" | "STOCK_OUT";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "createdAt" | "quantity";
  sortDir?: "asc" | "desc";
}) {
  const where = buildTransactionWhere(input);
  const orderBy = {
    [input.sortBy ?? "createdAt"]: input.sortDir ?? "desc",
  } as Prisma.TransactionOrderByWithRelationInput;

  const { rows, total } = await listTransactions({
    where,
    orderBy,
    skip: 0,
    take: AI_TOOL_LIST_MAX_ROWS,
  });

  return {
    items: rows.map((row) => ({
      id: row.id,
      type: row.type,
      quantity: row.quantity,
      createdAt: row.createdAt.toISOString(),
      productId: row.productId,
      productName: row.product.name,
      productSku: row.product.sku,
      userId: row.userId,
      userName: row.user.name,
      userEmail: row.user.email,
    })),
    total,
  };
}

function buildActivityLogWhere(input: {
  search?: string;
  action?: "CREATE" | "UPDATE" | "DELETE";
  entity?: "PRODUCT" | "CATEGORY" | "SUPPLIER" | "USER";
  dateFrom?: string;
  dateTo?: string;
}): Prisma.AuditLogWhereInput {
  const parts: Prisma.AuditLogWhereInput[] = [
    { action: { not: "STOCK_CHANGE" } },
    { entity: { not: "TRANSACTION" } },
  ];

  if (input.search) {
    parts.push({
      OR: [
        { entityId: { contains: input.search, mode: "insensitive" } },
        { user: { name: { contains: input.search, mode: "insensitive" } } },
      ],
    });
  }
  if (input.action) parts.push({ action: input.action });
  if (input.entity) parts.push({ entity: input.entity });
  if (input.dateFrom || input.dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (input.dateFrom) range.gte = startOfUtcDay(input.dateFrom);
    if (input.dateTo) range.lte = endOfUtcDay(input.dateTo);
    parts.push({ createdAt: range });
  }

  return { AND: parts };
}

export async function fetchActivityLogsForAssistant(input: {
  search?: string;
  action?: "CREATE" | "UPDATE" | "DELETE";
  entity?: "PRODUCT" | "CATEGORY" | "SUPPLIER" | "USER";
  dateFrom?: string;
  dateTo?: string;
  sortDir?: "asc" | "desc";
}) {
  const where = buildActivityLogWhere(input);
  const orderBy = {
    createdAt: input.sortDir ?? "desc",
  } as Prisma.AuditLogOrderByWithRelationInput;

  const { rows, total } = await listActivityLogs({
    where,
    orderBy,
    skip: 0,
    take: AI_TOOL_LIST_MAX_ROWS,
  });

  return {
    items: rows.map((row) => ({
      id: row.id,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      createdAt: row.createdAt.toISOString(),
      userId: row.userId,
      userName: row.user.name,
      userEmail: row.user.email,
    })),
    total,
  };
}

export async function fetchNotificationsForAssistant(userId: string) {
  const [[items, unreadCount], total] = await Promise.all([
    listNotificationsForUser(userId, AI_TOOL_LIST_MAX_ROWS),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      message: item.message,
      type: item.type,
      entityType: item.entityType,
      entityId: item.entityId,
      href: item.href,
      isRead: item.isRead,
      createdAt: item.createdAt.toISOString(),
    })),
    total,
    unreadCount,
  };
}
