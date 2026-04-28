import type { Prisma } from "@/generated/prisma/client";
import type {
  TransactionListItem,
  TransactionListQuery,
  TransactionListResult,
} from "@/types/transactions";
import { parseTransactionListQuery } from "@/server/transactions/validation";
import { listTransactions } from "@/server/transactions/transaction-repository";

function startOfUtcDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function endOfUtcDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

function buildWhere(query: TransactionListQuery): Prisma.TransactionWhereInput {
  const parts: Prisma.TransactionWhereInput[] = [];

  if (query.search) {
    parts.push({
      product: {
        name: { contains: query.search, mode: "insensitive" },
      },
    });
  }

  if (query.type) {
    parts.push({ type: query.type });
  }

  if (query.dateFrom || query.dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (query.dateFrom) {
      range.gte = startOfUtcDay(query.dateFrom);
    }
    if (query.dateTo) {
      range.lte = endOfUtcDay(query.dateTo);
    }
    parts.push({ createdAt: range });
  }

  return parts.length ? { AND: parts } : {};
}

function mapRow(row: {
  id: string;
  type: TransactionListItem["type"];
  quantity: number;
  createdAt: Date;
  productId: string;
  userId: string;
  product: { id: string; name: string; sku: string };
  user: { id: string; name: string; email: string };
}): TransactionListItem {
  return {
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
  };
}

export async function getTransactions(
  rawQuery: Record<string, string>,
): Promise<TransactionListResult> {
  const query = parseTransactionListQuery(rawQuery);
  const where = buildWhere(query);
  const orderBy = { [query.sortBy]: query.sortDir } as Prisma.TransactionOrderByWithRelationInput;

  const { rows, total } = await listTransactions({
    where,
    orderBy,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });

  const items = rows.map(mapRow);
  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}
