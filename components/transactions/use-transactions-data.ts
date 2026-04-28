"use client";

import { useCallback, useEffect, useState } from "react";
import type { TransactionListResult } from "@/types/transactions";

export type TransactionsQueryState = {
  page: number;
  search: string;
  type: "" | "STOCK_IN" | "STOCK_OUT";
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDir: string;
};

const PAGE_SIZE = 15;

export function useTransactionsData() {
  const [query, setQuery] = useState<TransactionsQueryState>({
    page: 1,
    search: "",
    type: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [result, setResult] = useState<TransactionListResult>({
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (q: TransactionsQueryState) => {
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(PAGE_SIZE),
      search: q.search,
      sortBy: q.sortBy,
      sortDir: q.sortDir,
    });
    if (q.type) params.set("type", q.type);
    if (q.dateFrom) params.set("dateFrom", q.dateFrom);
    if (q.dateTo) params.set("dateTo", q.dateTo);

    const res = await fetch(`/api/transactions?${params}`);
    const payload = (await res.json().catch(() => null)) as
      | TransactionListResult
      | { message?: string }
      | null;
    if (!res.ok) {
      throw new Error(
        (payload && "message" in payload && payload.message) ||
          "Failed to load transactions.",
      );
    }
    return payload as TransactionListResult;
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
            : "Failed to load transactions. Please refresh.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchList, query]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchList(query);
      setResult(data);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to load transactions. Please refresh.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchList, query]);

  return { query, setQuery, result, loading, error, reload };
}
