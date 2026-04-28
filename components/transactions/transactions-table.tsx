import type { TransactionListItem } from "@/types/transactions";
import { TransactionsTableSkeleton } from "@/components/transactions/transactions-table-skeleton";

const dtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type Props = {
  rows: TransactionListItem[];
  loading: boolean;
};

function TypeBadge({ type }: Readonly<{ type: TransactionListItem["type"] }>) {
  if (type === "STOCK_IN") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">
        Stock in
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
      Stock out
    </span>
  );
}

function QuantityCell({ row }: Readonly<{ row: TransactionListItem }>) {
  const isIn = row.type === "STOCK_IN";
  const signed = isIn ? `+${row.quantity}` : `−${row.quantity}`;
  return (
    <span
      className={`tabular-nums text-sm font-semibold ${
        isIn ? "text-blue-700" : "text-rose-700"
      }`}
    >
      {signed}
    </span>
  );
}

export function TransactionsTable({ rows, loading }: Readonly<Props>) {
  if (loading) {
    return <TransactionsTableSkeleton />;
  }

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-sm font-medium text-zinc-900">No transactions found</p>
        <p className="mt-2 text-sm text-zinc-500">
          Adjust filters or record stock movements from the Inventory page.
        </p>
      </div>
    );
  }

  return (
    <div className="ui-table-shell">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h2 className="ui-title-primary text-sm">Movement log</h2>
      </div>
      <table className="min-w-full text-sm">
        <thead className="ui-table-head">
          <tr>
            {[
              "Product",
              "Type",
              "Quantity",
              "Performed by",
              "Date & time",
            ].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-100">
              <td className="max-w-[220px] px-4 py-3">
                <p className="truncate font-medium text-zinc-900">{row.productName}</p>
                <p className="mt-0.5 font-mono text-xs text-zinc-500">{row.productSku}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <TypeBadge type={row.type} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <QuantityCell row={row} />
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{row.userName}</p>
                <p className="text-xs text-zinc-500">{row.userEmail}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                {dtFormatter.format(new Date(row.createdAt))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
