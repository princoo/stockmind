"use client";

import { useCallback, useEffect, useState } from "react";
import type { InventorySummary } from "@/types/inventory";
import type { ProductFormOption, ProductListResult } from "@/types/products";

type QueryState = {
  page: number;
  search: string;
  categoryId: string;
  sortBy: string;
  sortDir: string;
};

type ProductsResponse = ProductListResult & {
  options: { categories: ProductFormOption[]; suppliers: ProductFormOption[] };
};

const PAGE_SIZE = 10;

export function useInventoryData() {
  const [query, setQuery] = useState<QueryState>({
    page: 1,
    search: "",
    categoryId: "",
    sortBy: "quantity",
    sortDir: "asc",
  });
  const [result, setResult] = useState<ProductListResult>({
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [options, setOptions] = useState<{
    categories: ProductFormOption[];
    suppliers: ProductFormOption[];
  }>({ categories: [], suppliers: [] });
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (currentQuery: QueryState) => {
    const params = new URLSearchParams({
      page: String(currentQuery.page),
      pageSize: String(PAGE_SIZE),
      search: currentQuery.search,
      categoryId: currentQuery.categoryId,
      sortBy: currentQuery.sortBy,
      sortDir: currentQuery.sortDir,
    });
    params.set("includeOptions", "1");

    const [productsRes, summaryRes] = await Promise.all([
      fetch(`/api/products?${params}`),
      fetch("/api/inventory/summary"),
    ]);

    if (!productsRes.ok) {
      const payload = (await productsRes.json().catch(() => null)) as
        | { message?: string }
        | null;
      throw new Error(payload?.message ?? "Failed to fetch products.");
    }
    if (!summaryRes.ok) {
      const payload = (await summaryRes.json().catch(() => null)) as
        | { message?: string }
        | null;
      throw new Error(payload?.message ?? "Failed to fetch inventory summary.");
    }

    const productsJson = (await productsRes.json()) as ProductsResponse;
    const summaryJson = (await summaryRes.json()) as InventorySummary;
    return { productsJson, summaryJson };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await load(query);
        if (!active) return;
        setResult(data.productsJson);
        setOptions(data.productsJson.options);
        setSummary(data.summaryJson);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load inventory. Please refresh.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [load, query]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await load(query);
      setResult(data.productsJson);
      setOptions(data.productsJson.options);
      setSummary(data.summaryJson);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load inventory. Please refresh.",
      );
    } finally {
      setLoading(false);
    }
  }, [load, query]);

  return { query, setQuery, result, options, summary, loading, error, reload };
}

export async function postStockMovement(body: {
  productId: string;
  type: "STOCK_IN" | "STOCK_OUT";
  quantity: number;
}) {
  const response = await fetch("/api/inventory/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? "Stock operation failed.");
  }
  return payload;
}
