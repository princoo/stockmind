import type { ProductListItem } from "@/types/products";
import { InventoryStockBadge } from "@/components/inventory/inventory-stock-badge";
import { InventoryTableSkeleton } from "@/components/inventory/inventory-table-skeleton";

type Props = {
  rows: ProductListItem[];
  loading: boolean;
  canSendNotifications: boolean;
  onStockIn: (row: ProductListItem) => void;
  onStockOut: (row: ProductListItem) => void;
  onSendRestockEmail: (row: ProductListItem) => void;
};

function quantityClass(row: ProductListItem) {
  if (row.status === "OUT_OF_STOCK") return "font-semibold text-rose-700";
  if (row.status === "LOW_STOCK") return "font-semibold text-amber-700";
  return "font-medium text-blue-800";
}

export function InventoryTable({
  rows,
  loading,
  canSendNotifications,
  onStockIn,
  onStockOut,
  onSendRestockEmail,
}: Readonly<Props>) {
  if (loading) {
    return <InventoryTableSkeleton />;
  }

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-sm font-medium text-zinc-900">No products match filters</p>
        <p className="mt-2 text-sm text-zinc-500">
          Try clearing search or category, or add products from the Products page.
        </p>
      </div>
    );
  }

  return (
    <div className="ui-table-shell">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h2 className="ui-title-primary text-sm">Stock levels</h2>
      </div>
      <table className="min-w-full text-sm">
        <thead className="ui-table-head">
          <tr>
            {["SKU / item", "Category", "In stock", "Status", "Actions"].map(
              (h) => (
                <th key={h} className="px-4 py-3">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-100">
              <td className="px-4 py-3">
                <p className="font-mono text-xs font-semibold text-zinc-900">
                  {row.sku}
                </p>
                <p className="mt-0.5 font-medium text-zinc-900">{row.name}</p>
              </td>
              <td className="px-4 py-3 text-zinc-600">{row.categoryName}</td>
              <td className={`px-4 py-3 tabular-nums ${quantityClass(row)}`}>
                {row.quantity}
              </td>
              <td className="px-4 py-3">
                <InventoryStockBadge status={row.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onStockIn(row)}
                    className="ui-btn-primary px-3 py-1.5 text-xs"
                  >
                    + In
                  </button>
                  <button
                    type="button"
                    onClick={() => onStockOut(row)}
                    disabled={row.quantity <= 0}
                    className="inline-flex items-center justify-center rounded-xl border border-[#0058be] bg-white px-3 py-1.5 text-xs font-semibold text-[#0058be] transition-all hover:-translate-y-0.5 hover:bg-[#f2f5ff] disabled:pointer-events-none disabled:opacity-40"
                  >
                    − Out
                  </button>
                  {canSendNotifications && row.status !== "IN_STOCK" ? (
                    <button
                      type="button"
                      onClick={() => onSendRestockEmail(row)}
                      className="ui-btn-secondary px-3 py-1.5 text-xs"
                    >
                      Email supplier
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
