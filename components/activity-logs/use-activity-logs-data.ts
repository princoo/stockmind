"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActivityLogListResult } from "@/types/activity-logs";

export type ActivityLogsQueryState = {
  page: number;
  search: string;
  action: "" | "CREATE" | "UPDATE" | "DELETE";
  entity: "" | "PRODUCT" | "CATEGORY" | "SUPPLIER" | "USER";
  dateFrom: string;
  dateTo: string;
  sortDir: string;
};

const PAGE_SIZE = 15;

export function useActivityLogsData() {
  const [query, setQuery] = useState<ActivityLogsQueryState>({
    page: 1,
    search: "",
    action: "",
    entity: "",
    dateFrom: "",
    dateTo: "",
    sortDir: "desc",
  });
  const [result, setResult] = useState<ActivityLogListResult>({
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (q: ActivityLogsQueryState) => {
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(PAGE_SIZE),
      search: q.search,
      sortBy: "createdAt",
      sortDir: q.sortDir,
    });
    if (q.action) params.set("action", q.action);
    if (q.entity) params.set("entity", q.entity);
    if (q.dateFrom) params.set("dateFrom", q.dateFrom);
    if (q.dateTo) params.set("dateTo", q.dateTo);

    const res = await fetch(`/api/activity-logs?${params}`);
    const payload = (await res.json().catch(() => null)) as
      | ActivityLogListResult
      | { message?: string }
      | null;
    if (!res.ok) {
      throw new Error(
        (payload && "message" in payload && payload.message) ||
          "Failed to load activity logs.",
      );
    }
    return payload as ActivityLogListResult;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchList(query);
        if (!active) return;
        setResult(data);
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load activity logs. Please refresh.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchList, query]);

  return { query, setQuery, result, loading, error };
}
