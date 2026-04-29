"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReportsResponse } from "@/types/reports";

export type ReportsQueryState = {
  dateFrom: string;
  dateTo: string;
  productId: string;
  categoryId: string;
};

export function useReportsData() {
  const [query, setQuery] = useState<ReportsQueryState>({
    dateFrom: "",
    dateTo: "",
    productId: "",
    categoryId: "",
  });
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (query.dateFrom) params.set("dateFrom", query.dateFrom);
    if (query.dateTo) params.set("dateTo", query.dateTo);
    if (query.productId) params.set("productId", query.productId);
    if (query.categoryId) params.set("categoryId", query.categoryId);
    return params;
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?${queryParams.toString()}`);
      const payload = (await res.json().catch(() => null)) as
        | ReportsResponse
        | { message?: string }
        | null;
      if (!res.ok) {
        throw new Error((payload && "message" in payload && payload.message) || "Failed to load reports.");
      }
      setData(payload as ReportsResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    // Data fetching for this hook is intentionally triggered from an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { query, setQuery, data, loading, error, queryParams };
}
