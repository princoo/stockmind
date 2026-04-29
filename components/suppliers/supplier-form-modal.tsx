"use client";

import type { SupplierItem, SupplierPayload } from "@/types/suppliers";
import { getInitialSupplierForm } from "@/components/suppliers/use-suppliers-data";

type SupplierFormModalProps = Readonly<{
  open: boolean;
  submitting: boolean;
  item?: SupplierItem;
  onClose: () => void;
  onSubmit: (payload: SupplierPayload) => void;
}>;

function getTextField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function SupplierFormModal(props: SupplierFormModalProps) {
  if (!props.open) return null;
  const initial = getInitialSupplierForm(props.item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <form
        key={props.item?.id ?? "new"}
        className="w-full max-w-xl space-y-4 rounded bg-white p-5 text-zinc-900 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          props.onSubmit({
            name: getTextField(formData, "name"),
            contactPerson: getTextField(formData, "contactPerson"),
            phone: getTextField(formData, "phone"),
            email: getTextField(formData, "email"),
            isActive: formData.get("isActive") === "on",
          });
        }}
      >
        <h2 className="text-xl font-semibold text-zinc-900">
          {props.item ? "Edit Supplier" : "Create Supplier"}
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            required
            name="name"
            defaultValue={initial.name}
            placeholder="Supplier name"
            className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 md:col-span-2"
          />
          <input
            name="contactPerson"
            defaultValue={initial.contactPerson}
            placeholder="Contact person (optional)"
            className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <input
            name="phone"
            defaultValue={initial.phone}
            placeholder="Phone (optional)"
            className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
          <input
            type="email"
            name="email"
            defaultValue={initial.email}
            placeholder="Email (optional)"
            className="h-10 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 md:col-span-2"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initial.isActive}
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
