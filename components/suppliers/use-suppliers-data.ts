"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  SupplierItem,
  SupplierListResult,
  SupplierPayload,
} from "@/types/suppliers";

const defaultResult: SupplierListResult = {
  items: [],
  page: 1,
  pageSize: 5,
  total: 0,
  totalPages: 1,
};

export function useSuppliersData() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SupplierListResult>(defaultResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextSearch: string, nextPage: number) => {
    const params = new URLSearchParams({
      search: nextSearch,
      page: String(nextPage),
      pageSize: "5",
      sortBy: "createdAt",
      sortDir: "desc",
    });
    const response = await fetch(`/api/suppliers?${params}`);
    if (!response.ok) throw new Error((await response.json()).message);
    return (await response.json()) as SupplierListResult;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const payload = await load(search, page);
        if (!active) return;
        setResult(payload);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Load failed");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [load, page, search]);

  return { search, setSearch, page, setPage, result, loading, error };
}

export async function createSupplier(payload: SupplierPayload) {
  const response = await fetch("/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error((await response.json()).message);
}

export async function updateSupplier(id: string, payload: SupplierPayload) {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error((await response.json()).message);
}

export async function deleteSupplier(id: string) {
  const response = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error((await response.json()).message);
}

export function getInitialSupplierForm(item?: SupplierItem) {
  return {
    name: item?.name ?? "",
    contactPerson: item?.contactPerson ?? "",
    email: item?.email ?? "",
    phone: item?.phone ?? "",
    isActive: item ? item.status === "ACTIVE" : true,
  };
}
