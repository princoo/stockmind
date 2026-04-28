import type { CategoryItem } from "@/types/categories";

type CategoriesGridProps = {
  items: CategoryItem[];
  loading: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (item: CategoryItem) => void;
  onDelete: (item: CategoryItem) => void;
  onCreate: () => void;
};

export function CategoriesGrid(props: Readonly<CategoriesGridProps>) {
  if (props.loading) {
    return <div className="rounded border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Loading categories...</div>;
  }
  if (!props.items.length) {
    if (!props.canCreate) {
      return (
        <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center text-zinc-500">
          No categories found.
        </div>
      );
    }
    return (
      <button onClick={props.onCreate} className="w-full rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-2xl">+</div>
        <p className="text-lg font-semibold text-zinc-800">Create New Category</p>
        <p className="text-sm">Set up your first product classification group</p>
      </button>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {props.items.map((item) => (
        <article key={item.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-2xl font-semibold text-zinc-900">{item.name}</h3>
          <p className="mt-1 inline-flex rounded-full bg-[#eef2ff] px-2 py-1 text-xs font-medium text-[#4355a6]">
            {item.productCount.toLocaleString()} Products
          </p>
          <p className="mt-3 min-h-14 text-sm text-zinc-600">
            {item.description || "No description provided yet."}
          </p>
          <p className="mt-2 text-xs text-zinc-500">Created {new Date(item.createdAt).toLocaleDateString()}</p>
          {props.canUpdate || props.canDelete ? (
            <div className="mt-4 flex gap-2">
              {props.canUpdate ? (
                <button onClick={() => props.onEdit(item)} className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">Edit</button>
              ) : null}
              {props.canDelete ? (
                <button onClick={() => props.onDelete(item)} className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600">Delete</button>
              ) : null}
            </div>
          ) : null}
        </article>
      ))}
      {props.canCreate ? (
        <button onClick={props.onCreate} className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-xl">+</div>
          <p className="text-lg font-semibold text-zinc-800">Create New Category</p>
          <p className="text-sm text-zinc-500">Set up a new product classification group</p>
        </button>
      ) : null}
    </div>
  );
}
