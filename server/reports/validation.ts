import type { ReportsQuery } from "@/types/reports";
import { ReportsServiceError } from "@/server/reports/errors";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(value: string | undefined, label: string): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  if (!DATE_RE.test(v)) {
    throw new ReportsServiceError(
      `${label} must be in YYYY-MM-DD format.`,
    );
  }
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new ReportsServiceError(`${label} is not a valid date.`);
  }
  return v;
}

export function parseReportsQuery(input: Record<string, string>): ReportsQuery {
  const dateFrom = parseDateOnly(input.dateFrom, "dateFrom");
  const dateTo = parseDateOnly(input.dateTo, "dateTo");

  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new ReportsServiceError("dateFrom cannot be after dateTo.");
  }

  return {
    dateFrom,
    dateTo,
    productId: input.productId?.trim() || undefined,
    categoryId: input.categoryId?.trim() || undefined,
  };
}
