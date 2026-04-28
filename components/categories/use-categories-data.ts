"use client";

import { useCallback, useEffect, useState } from "react";
import type { CategoryItem, CategoryListResult } from "@/types/categories";

export function useCategoriesData() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (searchValue: string) => {
    const params = new URLSearchParams({ search: searchValue });
    const response = await fetch(`/api/categories?${params}`);
    if (!response.ok) throw new Error((await response.json()).message);
    const payload = (await response.json()) as CategoryListResult;
    return payload.items;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const next = await load(search);
        if (!active) return;
        setItems(next);
        setError(null);
      } catch (error) {
        if (!active) return;
        setError(error instanceof Error ? error.message : "Load failed");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [load, search]);

  return { search, setSearch, items, loading, error, setItems, setLoading, setError };
}

export async function createCategory(name: string, description: string) {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  if (!response.ok) throw new Error((await response.json()).message);
}

export async function updateCategory(id: string, name: string, description: string) {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  if (!response.ok) throw new Error((await response.json()).message);
}

export async function deleteCategory(id: string) {
  const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error((await response.json()).message);
}
