import type { AuditAction, AuditEntity } from "@/generated/prisma/enums";
import {
  AuditAction as AuditActionEnum,
  AuditEntity as AuditEntityEnum,
} from "@/generated/prisma/enums";
import type { ActivityLogListQuery } from "@/types/activity-logs";
import { ActivityLogServiceError } from "@/server/activity-logs/errors";

const sortDirSet = new Set(["asc", "desc"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDateOnly(value: string | undefined, label: string): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  if (!DATE_RE.test(v)) {
    throw new ActivityLogServiceError(
      `${label} must be a valid date in YYYY-MM-DD format.`,
    );
  }
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new ActivityLogServiceError(
      `${label} must be a valid calendar date.`,
    );
  }
  return v;
}

function parseAction(value: string | undefined): AuditAction | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (
    raw !== AuditActionEnum.CREATE &&
    raw !== AuditActionEnum.UPDATE &&
    raw !== AuditActionEnum.DELETE
  ) {
    throw new ActivityLogServiceError("Invalid action filter.");
  }
  return raw;
}

function parseEntity(value: string | undefined): AuditEntity | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (
    raw !== AuditEntityEnum.PRODUCT &&
    raw !== AuditEntityEnum.CATEGORY &&
    raw !== AuditEntityEnum.SUPPLIER &&
    raw !== AuditEntityEnum.USER
  ) {
    throw new ActivityLogServiceError("Invalid entity filter.");
  }
  return raw;
}

export function parseActivityLogListQuery(
  input: Record<string, string>,
): ActivityLogListQuery {
  const page = Math.max(Number(input.page || "1"), 1);
  const pageSize = Math.min(Math.max(Number(input.pageSize || "15"), 1), 50);
  const sortDir = sortDirSet.has(input.sortDir) ? input.sortDir : "desc";
  const search = input.search?.trim() || undefined;
  const action = parseAction(input.action);
  const entity = parseEntity(input.entity);
  const dateFrom = parseIsoDateOnly(input.dateFrom, "dateFrom");
  const dateTo = parseIsoDateOnly(input.dateTo, "dateTo");

  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new ActivityLogServiceError("dateFrom cannot be after dateTo.");
  }

  return {
    page,
    pageSize,
    search,
    action,
    entity,
    dateFrom,
    dateTo,
    sortBy: "createdAt",
    sortDir: sortDir as ActivityLogListQuery["sortDir"],
  };
}
