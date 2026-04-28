import type { ProductStatus } from "@/types/products";

const config: Record<
  ProductStatus,
  { label: string; className: string; dotClass: string }
> = {
  IN_STOCK: {
    label: "Optimal",
    className: "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
    dotClass: "bg-blue-500",
  },
  LOW_STOCK: {
    label: "Low stock",
    className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    dotClass: "bg-amber-500",
  },
  OUT_OF_STOCK: {
    label: "Critical low",
    className: "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
    dotClass: "bg-rose-500",
  },
};

export function InventoryStockBadge({
  status,
}: Readonly<{ status: ProductStatus }>) {
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dotClass}`} />
      {c.label}
    </span>
  );
}
