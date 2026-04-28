"use client";

import { useCallback, useEffect, useState } from "react";
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

export function useProductsData() {
  const [query, setQuery] = useState<QueryState>({
    page: 1,
    search: "",
    categoryId: "",
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [result, setResult] = useState<ProductListResult>({
    items: [],
    page: 1,
    pageSize: 5,
    total: 0,
    totalPages: 1,
  });
  const [options, setOptions] = useState<{
    categories: ProductFormOption[];
    suppliers: ProductFormOption[];
  }>({ categories: [], suppliers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (currentQuery: QueryState) => {
    const params = new URLSearchParams({
      page: String(currentQuery.page),
      pageSize: "5",
      search: currentQuery.search,
      categoryId: currentQuery.categoryId,
      sortBy: currentQuery.sortBy,
      sortDir: currentQuery.sortDir,
    });
    params.set("includeOptions", "1");
    const productsRes = await fetch(`/api/products?${params}`);
    if (!productsRes.ok) {
      const payload = (await productsRes.json().catch(() => null)) as
        | { message?: string }
        | null;
      throw new Error(payload?.message ?? "Failed to fetch products.");
    }
    return (await productsRes.json()) as ProductsResponse;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetchProducts(query);
        if (!active) return;
        setResult(response);
        setOptions(response.options);
        setError(null);
      } catch (error) {
        if (!active) return;
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load products. Please refresh.",
        );
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchProducts, query]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchProducts(query);
      setResult(response);
      setOptions(response.options);
      setError(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load products. Please refresh.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchProducts, query]);

  return { query, setQuery, result, options, loading, error, reload };
}

export async function createProduct(payload: Record<string, unknown>) {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error((await response.json()).message ?? "Create failed");
}

export async function updateProduct(
  id: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error((await response.json()).message ?? "Update failed");
}

export async function deleteProduct(id: string) {
  const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
  if (!response.ok)
    throw new Error((await response.json()).message ?? "Delete failed");
}

export type { ProductListItem } from "@/types/products";
