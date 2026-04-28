import type { AuditAction, AuditEntity } from "@/generated/prisma/enums";

export type ActivityLogListItem = {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
};

export type ActivityLogListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  dateFrom?: string;
  dateTo?: string;
  sortBy: "createdAt";
  sortDir: "asc" | "desc";
};

export type ActivityLogListResult = {
  items: ActivityLogListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
