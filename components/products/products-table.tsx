import type { ProductListItem } from "@/types/products";
import { StatusBadge } from "@/components/products/status-badge";
import { formatRwf } from "@/lib/currency";

type ProductsTableProps = {
  rows: ProductListItem[];
  loading: boolean;
  canManageProducts: boolean;
  canDeleteProducts: boolean;
  canSendNotifications: boolean;
  onEdit: (row: ProductListItem) => void;
  onDelete: (row: ProductListItem) => void;
  onSendRestockEmail: (row: ProductListItem) => void;
};

export function ProductsTable({
  rows,
  loading,
  canManageProducts,
  canDeleteProducts,
  canSendNotifications,
  onEdit,
  onDelete,
  onSendRestockEmail,
}: Readonly<ProductsTableProps>) {
  if (loading) return <div className="ui-panel p-6 text-sm text-zinc-500">Loading products...</div>;
  if (!rows.length) return <div className="ui-panel p-6 text-sm text-zinc-500">No products found.</div>;

  return (
    <div className="ui-table-shell">
      <table className="min-w-full text-sm">
        <thead className="ui-table-head">
          <tr>
            {["Product", "SKU", "Category", "Price", "Stock", ...(canManageProducts ? ["Actions"] : [])].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-200">
              <td className="px-4 py-3"><p className="font-medium text-zinc-900">{row.name}</p><p className="text-xs text-zinc-500">{row.supplierName}</p></td>
              <td className="px-4 py-3 text-zinc-600">{row.sku}</td>
              <td className="px-4 py-3 text-zinc-600">{row.categoryName}</td>
              <td className="px-4 py-3 font-medium text-zinc-900">{formatRwf(row.price)}</td>
              <td className="px-4 py-3"><StatusBadge status={row.status} quantity={row.quantity} /></td>
              {canManageProducts ? (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(row)} className="ui-btn-secondary px-2.5 py-1 text-xs">Edit</button>
                    {canDeleteProducts ? (
                      <button onClick={() => onDelete(row)} className="rounded-xl border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50">Delete</button>
                    ) : null}
                    {canSendNotifications ? (
                      <button
                        onClick={() => onSendRestockEmail(row)}
                        className="ui-btn-secondary px-2.5 py-1 text-xs"
                      >
                        Email supplier
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
