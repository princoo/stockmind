import type { SupplierItem } from "@/types/suppliers";

type SuppliersTableProps = Readonly<{
  rows: SupplierItem[];
  loading: boolean;
  canManageSuppliers: boolean;
  onEdit: (row: SupplierItem) => void;
  onDelete: (row: SupplierItem) => void;
}>;

export function SuppliersTable(props: SuppliersTableProps) {
  if (props.loading) {
    return (
      <div className="rounded border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
        Loading suppliers...
      </div>
    );
  }
  if (!props.rows.length) {
    return (
      <div className="rounded border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
        No suppliers found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-[#f2f5ff] text-left text-xs uppercase tracking-wide text-zinc-600">
          <tr>
            {[
              "Supplier Name",
              "Contact Person",
              "Email",
              "Phone",
              "Status",
              ...(props.canManageSuppliers ? ["Actions"] : []),
            ].map((header) => (
              <th key={header} className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-200">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{row.name}</p>
                <p className="text-xs text-zinc-500">
                  {row.productCount.toLocaleString()} linked products
                </p>
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {row.contactPerson || "--"}
              </td>
              <td className="px-4 py-3 text-zinc-600">{row.email || "--"}</td>
              <td className="px-4 py-3 text-zinc-600">{row.phone || "--"}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    row.status === "ACTIVE"
                      ? "inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                      : "inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700"
                  }
                >
                  {row.status}
                </span>
              </td>
              {props.canManageSuppliers ? (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => props.onEdit(row)}
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => props.onDelete(row)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                    >
                      Delete
                    </button>
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
