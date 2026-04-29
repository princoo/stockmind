"use client";
import type { CategoryItem } from "@/types/categories";

type CategoryFormModalProps = {
  open: boolean;
  item?: CategoryItem;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
};

function getTextField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function CategoryFormModal(props: Readonly<CategoryFormModalProps>) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <form
        key={props.item?.id ?? "new"}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const name = getTextField(formData, "name");
          const description = getTextField(formData, "description");
          props.onSubmit(name, description);
        }}
        className="w-full max-w-md space-y-4 rounded bg-white p-5 text-zinc-900 shadow-xl"
      >
        <h2 className="text-xl font-semibold text-zinc-900">
          {props.item ? "Edit Category" : "Create Category"}
        </h2>
        <input
          name="name"
          defaultValue={props.item?.name ?? ""}
          placeholder="Category name"
          className="h-10 w-full rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400"
          required
        />
        <textarea
          name="description"
          defaultValue={props.item?.description ?? ""}
          placeholder="Category description"
          rows={4}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={props.onClose} className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </button>
          <button disabled={props.submitting} className="rounded bg-[#0058be] px-3 py-2 text-sm font-medium text-white hover:bg-[#004ca3] disabled:opacity-60">
            {props.submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
