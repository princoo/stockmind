import type { Prisma } from "@/generated/prisma/client";
import type {
  ActivityLogListItem,
  ActivityLogListQuery,
  ActivityLogListResult,
} from "@/types/activity-logs";
import { parseActivityLogListQuery } from "@/server/activity-logs/validation";
import { listActivityLogs } from "@/server/activity-logs/activity-log-repository";

function startOfUtcDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function endOfUtcDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

function buildWhere(query: ActivityLogListQuery): Prisma.AuditLogWhereInput {
  const parts: Prisma.AuditLogWhereInput[] = [
    // Inventory movements are already represented in Transactions;
    // exclude stock-change audit events from this page.
    { action: { not: "STOCK_CHANGE" } },
    { entity: { not: "TRANSACTION" } },
  ];

  if (query.search) {
    parts.push({
      OR: [
        { entityId: { contains: query.search, mode: "insensitive" } },
        { user: { name: { contains: query.search, mode: "insensitive" } } },
      ],
    });
  }

  if (query.action) {
    parts.push({ action: query.action });
  }

  if (query.entity) {
    parts.push({ entity: query.entity });
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
  action: ActivityLogListItem["action"];
  entity: ActivityLogListItem["entity"];
  entityId: string;
  createdAt: Date;
  userId: string;
  user: { id: string; name: string; email: string };
}): ActivityLogListItem {
  return {
    id: row.id,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    createdAt: row.createdAt.toISOString(),
    userId: row.userId,
    userName: row.user.name,
    userEmail: row.user.email,
  };
}

export async function getActivityLogs(
  rawQuery: Record<string, string>,
): Promise<ActivityLogListResult> {
  const query = parseActivityLogListQuery(rawQuery);
  const where = buildWhere(query);
  const orderBy = {
    [query.sortBy]: query.sortDir,
  } as Prisma.AuditLogOrderByWithRelationInput;

  const { rows, total } = await listActivityLogs({
    where,
    orderBy,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });

  return {
    items: rows.map(mapRow),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / query.pageSize), 1),
  };
}
