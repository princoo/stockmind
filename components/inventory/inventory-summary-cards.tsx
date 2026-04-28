import type { InventorySummary } from "@/types/inventory";
import { formatRwf } from "@/lib/currency";

type Props = {
  summary: InventorySummary | null;
  loading: boolean;
};

export function InventorySummaryCards({ summary, loading }: Readonly<Props>) {
  if (loading && !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-zinc-200 bg-white p-5"
          >
            <div className="h-3 w-24 rounded bg-zinc-200" />
            <div className="mt-3 h-8 w-32 rounded bg-zinc-200" />
            <div className="mt-2 h-3 w-40 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#0b63cf]">
          Total inventory value
        </p>
        <p className="mt-2 text-2xl font-semibold text-zinc-900">
          {formatRwf(summary.totalInventoryValue)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">Based on current quantity × price</p>
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-800">
          Items needing reorder
        </p>
        <p className="mt-2 text-2xl font-semibold text-blue-900">
          {summary.itemsNeedingReorder}
        </p>
        <p className="mt-1 text-xs text-blue-800/90">
          At or below low-stock threshold
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#0b63cf]">
          Total SKUs
        </p>
        <p className="mt-2 text-2xl font-semibold text-zinc-900">
          {summary.totalSkus.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-zinc-500">Active products in catalog</p>
      </div>
    </div>
  );
}
