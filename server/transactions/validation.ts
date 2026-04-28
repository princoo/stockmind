import type { TransactionType } from "@/generated/prisma/enums";
import { TransactionType as TransactionTypeEnum } from "@/generated/prisma/enums";
import type { TransactionListQuery } from "@/types/transactions";
import { TransactionServiceError } from "@/server/transactions/errors";

const sortBySet = new Set(["createdAt", "quantity"]);
const sortDirSet = new Set(["asc", "desc"]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDateOnly(value: string | undefined, label: string): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  if (!DATE_RE.test(v)) {
    throw new TransactionServiceError(
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
    throw new TransactionServiceError(
      `${label} must be a valid calendar date.`,
    );
  }
  return v;
}

export function parseTransactionListQuery(
  input: Record<string, string>,
): TransactionListQuery {
  const page = Math.max(Number(input.page || "1"), 1);
  const pageSize = Math.min(Math.max(Number(input.pageSize || "15"), 1), 50);
  const sortBy = sortBySet.has(input.sortBy) ? input.sortBy : "createdAt";
  const sortDir = sortDirSet.has(input.sortDir) ? input.sortDir : "desc";
  const search = input.search?.trim() || undefined;

  const typeRaw = input.type?.trim();
  let type: TransactionType | undefined;
  if (typeRaw) {
    if (
      typeRaw !== TransactionTypeEnum.STOCK_IN &&
      typeRaw !== TransactionTypeEnum.STOCK_OUT
    ) {
      throw new TransactionServiceError(
        "Type filter must be STOCK_IN, STOCK_OUT, or empty.",
      );
    }
    type = typeRaw;
  }

  const dateFrom = parseIsoDateOnly(input.dateFrom, "dateFrom");
  const dateTo = parseIsoDateOnly(input.dateTo, "dateTo");

  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new TransactionServiceError("dateFrom cannot be after dateTo.");
  }

  return {
    page,
    pageSize,
    search,
    type,
    dateFrom,
    dateTo,
    sortBy: sortBy as TransactionListQuery["sortBy"],
    sortDir: sortDir as TransactionListQuery["sortDir"],
  };
}
