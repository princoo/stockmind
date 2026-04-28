import type { CategoryItem } from "@/types/categories";

type CategoriesTableProps = {
  items: CategoryItem[];
  loading: boolean;
  onEdit: (item: CategoryItem) => void;
  onDelete: (item: CategoryItem) => void;
};

export function CategoriesTable(props: CategoriesTableProps) {
  if (props.loading) {
    return <div className="rounded border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Loading categories...</div>;
  }
  if (!props.items.length) {
    return <div className="rounded border border-zinc-200 bg-white p-6 text-sm text-zinc-500">No categories found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-[#f2f5ff] text-left text-xs uppercase tracking-wide text-zinc-600">
          <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Actions</th></tr>
        </thead>
        <tbody>
          {props.items.map((item) => (
            <tr key={item.id} className="border-t border-zinc-200">
              <td className="px-4 py-3 font-medium text-zinc-900">{item.name}</td>
              <td className="px-4 py-3 text-zinc-600">{new Date(item.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => props.onEdit(item)} className="rounded border border-zinc-200 px-2 py-1 text-xs">Edit</button>
                  <button onClick={() => props.onDelete(item)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
