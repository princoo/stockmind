"use client";

import { useEffect, useState } from "react";
import type { ProductFormOption, ProductListItem } from "@/types/products";

type ProductFormModalProps = Readonly<{
  open: boolean;
  submitting: boolean;
  categories: ProductFormOption[];
  suppliers: ProductFormOption[];
  product?: ProductListItem;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}>;

export function ProductFormModal(props: ProductFormModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!props.product) return setForm({ quantity: "0", lowStockThreshold: "10" });
    setForm({ name: props.product.name, sku: props.product.sku, price: String(props.product.price), quantity: String(props.product.quantity), lowStockThreshold: String(props.product.lowStockThreshold), categoryId: props.product.categoryId, supplierId: props.product.supplierId });
  }, [props.product, props.open]);
  if (!props.open) return null;

  const onChange = (key: string, value: string) => setForm((v) => ({ ...v, [key]: value }));
  const submit = (
    e: Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0],
  ) => {
    e.preventDefault();
    props.onSubmit({ ...form, price: Number(form.price), quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <form onSubmit={submit} className="w-full max-w-xl space-y-3 rounded bg-white p-5 text-zinc-900 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">{props.product ? "Edit Product" : "Create Product"}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {["name", "sku", "price", "quantity", "lowStockThreshold"].map((key) => <input key={key} required value={form[key] ?? ""} onChange={(e) => onChange(key, e.target.value)} placeholder={key} className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400" disabled={Boolean(props.product && key === "quantity")} />)}
          <select value={form.categoryId ?? ""} onChange={(e) => onChange("categoryId", e.target.value)} className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900">
            <option value="">Select category</option>{props.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={form.supplierId ?? ""} onChange={(e) => onChange("supplierId", e.target.value)} className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900">
            <option value="">Select supplier</option>{props.suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        {props.product ? <p className="text-xs text-zinc-500">Quantity is managed by transactions and cannot be edited here.</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={props.onClose} className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
          <button disabled={props.submitting} className="rounded bg-[#0058be] px-3 py-2 text-sm font-medium text-white hover:bg-[#004ca3] disabled:opacity-60">{props.submitting ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
