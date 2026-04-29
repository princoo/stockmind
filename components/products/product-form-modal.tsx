"use client";

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

function getTextField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function ProductFormModal(props: ProductFormModalProps) {
  if (!props.open) return null;

  const submit = (
    e: Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0],
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    props.onSubmit({
      name: getTextField(formData, "name"),
      sku: getTextField(formData, "sku"),
      price: Number(formData.get("price") ?? 0),
      quantity: Number(formData.get("quantity") ?? 0),
      lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 0),
      categoryId: getTextField(formData, "categoryId"),
      supplierId: getTextField(formData, "supplierId"),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <form key={props.product?.id ?? "new"} onSubmit={submit} className="w-full max-w-xl space-y-3 rounded bg-white p-5 text-zinc-900 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">{props.product ? "Edit Product" : "Create Product"}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input name="name" required defaultValue={props.product?.name ?? ""} placeholder="name" className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400" />
          <input name="sku" required defaultValue={props.product?.sku ?? ""} placeholder="sku" className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400" />
          <input name="price" required defaultValue={props.product ? String(props.product.price) : ""} placeholder="price" className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400" />
          <input name="quantity" required defaultValue={props.product ? String(props.product.quantity) : "0"} placeholder="quantity" className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400" disabled={Boolean(props.product)} />
          <input name="lowStockThreshold" required defaultValue={props.product ? String(props.product.lowStockThreshold) : "10"} placeholder="lowStockThreshold" className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400" />
          <select name="categoryId" defaultValue={props.product?.categoryId ?? ""} className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900">
            <option value="">Select category</option>{props.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select name="supplierId" defaultValue={props.product?.supplierId ?? ""} className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900">
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
