"use client";

import { useEffect, useState } from "react";
import type { SupplierItem, SupplierPayload } from "@/types/suppliers";
import { getInitialSupplierForm } from "@/components/suppliers/use-suppliers-data";

type SupplierFormModalProps = Readonly<{
  open: boolean;
  submitting: boolean;
  item?: SupplierItem;
  onClose: () => void;
  onSubmit: (payload: SupplierPayload) => void;
}>;

export function SupplierFormModal(props: SupplierFormModalProps) {
  const [form, setForm] = useState(getInitialSupplierForm(props.item));

  useEffect(() => {
    setForm(getInitialSupplierForm(props.item));
  }, [props.item, props.open]);

  if (!props.open) return null;

  const onChange = (key: keyof SupplierPayload, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <form
        className="w-full max-w-xl space-y-4 rounded bg-white p-5 text-zinc-900 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit(form);
        }}
      >
        <h2 className="text-xl font-semibold text-zinc-900">
          {props.item ? "Edit Supplier" : "Create Supplier"}
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            required
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Supplier name"
            className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 md:col-span-2"
          />
          <input
            value={form.contactPerson}
            onChange={(event) => onChange("contactPerson", event.target.value)}
            placeholder="Contact person (optional)"
            className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <input
            value={form.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="Phone (optional)"
            className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="Email (optional)"
            className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 md:col-span-2"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => onChange("isActive", event.target.checked)}
          />
          Supplier is active
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            disabled={props.submitting}
            className="rounded bg-[#0058be] px-3 py-2 text-sm font-medium text-white hover:bg-[#004ca3] disabled:opacity-60"
          >
            {props.submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
