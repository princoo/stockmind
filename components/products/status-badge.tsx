import type { ProductStatus } from "@/types/products";

const styles: Record<ProductStatus, string> = {
  IN_STOCK: "bg-blue-50 text-blue-700",
  LOW_STOCK: "bg-indigo-50 text-indigo-700",
  OUT_OF_STOCK: "bg-sky-100 text-sky-700",
};

export function StatusBadge({
  status,
  quantity,
}: Readonly<{
  status: ProductStatus;
  quantity: number;
}>) {
  const text = status === "OUT_OF_STOCK" ? "Out of stock" : `${quantity} in stock`;
  return (
    <span className={`inline-flex rounded-xl px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {text}
    </span>
  );
}
