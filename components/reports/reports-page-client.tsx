"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useReportsData } from "@/components/reports/use-reports-data";
import { formatRwf } from "@/lib/currency";

const intFmt = new Intl.NumberFormat();

function buildExportHref(
  section: "stock-summary" | "low-stock" | "transaction-summary" | "available-products",
  params: URLSearchParams,
) {
  const next = new URLSearchParams(params);
  next.set("section", section);
  return `/api/reports/export?${next.toString()}`;
}

const loadingKeys = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function LoadingBlock({ rows = 4 }: Readonly<{ rows?: number }>) {
  return (
    <div className="divide-y divide-zinc-100">
      {loadingKeys.slice(0, rows).map((key) => (
        <div key={`s-${key}`} className="px-4 py-3">
          <div className="h-3 w-40 animate-pulse rounded bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

export function ReportsPageClient() {
  const { query, setQuery, data, loading, error, queryParams } = useReportsData();

  const exportLinks = useMemo(
    () => ({
      stockSummary: buildExportHref("stock-summary", queryParams),
      lowStock: buildExportHref("low-stock", queryParams),
      transactionSummary: buildExportHref("transaction-summary", queryParams),
      products: buildExportHref("available-products", queryParams),
    }),
    [queryParams],
  );

  const options = data?.options ?? { categories: [], products: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ui-page-title ui-title-primary">Reports</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Analyze inventory and transaction insights with exportable reports.
        </p>
      </div>

      <section className="ui-glass p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="date"
            value={query.dateFrom}
            onChange={(e) => setQuery((q) => ({ ...q, dateFrom: e.target.value }))}
            className="ui-input"
            aria-label="Date from"
          />
          <input
            type="date"
            value={query.dateTo}
            onChange={(e) => setQuery((q) => ({ ...q, dateTo: e.target.value }))}
            className="ui-input"
            aria-label="Date to"
          />
          <select
            value={query.categoryId}
            onChange={(e) =>
              setQuery((q) => ({ ...q, categoryId: e.target.value, productId: "" }))
            }
            className="ui-select"
          >
            <option value="">All categories</option>
            {options.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={query.productId}
            onChange={(e) => setQuery((q) => ({ ...q, productId: e.target.value }))}
            className="ui-select"
          >
            <option value="">All products</option>
            {options.products
              .filter((p) => !query.categoryId || p.categoryId === query.categoryId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={() =>
              setQuery({
                dateFrom: "",
                dateTo: "",
                productId: "",
                categoryId: "",
              })
            }
            className="ui-btn-secondary h-10 px-3"
          >
            Reset filters
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="ui-table-shell">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h2 className="ui-title-primary text-sm">Stock summary</h2>
          <Link href={exportLinks.stockSummary} className="text-xs font-semibold text-[#0058be] hover:text-[#004ca3]">
            Export CSV
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f2f5ff] text-left text-xs uppercase tracking-wide text-zinc-600">
              <tr>
                {["Category", "Products", "Total Qty", "Total Value", "Low Stock"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><LoadingBlock rows={4} /></td></tr>
              ) : data?.stockSummary.length ? (
                data.stockSummary.map((row) => (
                  <tr key={row.categoryName} className="border-t border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">{row.categoryName}</td>
                    <td className="px-4 py-3 text-zinc-700">{intFmt.format(row.productCount)}</td>
                    <td className="px-4 py-3 text-zinc-700">{intFmt.format(row.totalQuantity)}</td>
                    <td className="px-4 py-3 text-zinc-700">{formatRwf(row.totalValue)}</td>
                    <td className="px-4 py-3 font-semibold text-amber-700">{intFmt.format(row.lowStockCount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">No stock summary data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="ui-table-shell">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="ui-title-primary text-sm">Low stock report</h2>
            <Link href={exportLinks.lowStock} className="text-xs font-semibold text-[#0058be] hover:text-[#004ca3]">
              Export CSV
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f2f5ff] text-left text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  {["Product", "Category", "Qty", "Threshold"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4}><LoadingBlock rows={5} /></td></tr>
                ) : data?.lowStock.length ? (
                  data.lowStock.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-100">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">{row.name}</p>
                        <p className="font-mono text-xs text-zinc-500">{row.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{row.categoryName}</td>
                      <td className="px-4 py-3 font-semibold text-amber-700">{row.quantity}</td>
                      <td className="px-4 py-3 text-zinc-700">{row.lowStockThreshold}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">No low stock items.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ui-table-shell">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="ui-title-primary text-sm">Transaction summary</h2>
            <Link href={exportLinks.transactionSummary} className="text-xs font-semibold text-[#0058be] hover:text-[#004ca3]">
              Export CSV
            </Link>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {loading || !data ? (
              <>
                <div className="h-20 animate-pulse rounded bg-zinc-100" />
                <div className="h-20 animate-pulse rounded bg-zinc-100" />
                <div className="h-20 animate-pulse rounded bg-zinc-100" />
                <div className="h-20 animate-pulse rounded bg-zinc-100" />
              </>
            ) : (
              <>
                <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Total transactions</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-900">{intFmt.format(data.transactionSummary.totalTransactions)}</p>
                </div>
                <div className="rounded border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">Stock in quantity</p>
                  <p className="mt-1 text-2xl font-semibold text-blue-800">{intFmt.format(data.transactionSummary.stockInQuantity)}</p>
                </div>
                <div className="rounded border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs text-rose-700">Stock out quantity</p>
                  <p className="mt-1 text-2xl font-semibold text-rose-800">{intFmt.format(data.transactionSummary.stockOutQuantity)}</p>
                </div>
                <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Net movement</p>
                  <p className={`mt-1 text-2xl font-semibold ${data.transactionSummary.netQuantity >= 0 ? "text-blue-700" : "text-rose-700"}`}>
                    {data.transactionSummary.netQuantity >= 0 ? "+" : ""}
                    {intFmt.format(data.transactionSummary.netQuantity)}
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <section className="ui-table-shell">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h2 className="ui-title-primary text-sm">Available products</h2>
          <Link href={exportLinks.products} className="text-xs font-semibold text-[#0058be] hover:text-[#004ca3]">
            Export CSV
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f2f5ff] text-left text-xs uppercase tracking-wide text-zinc-600">
              <tr>
                {["Product", "Category", "Quantity", "Unit Price", "Stock Value"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><LoadingBlock rows={6} /></td></tr>
              ) : data?.availableProducts.length ? (
                data.availableProducts.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{row.name}</p>
                      <p className="font-mono text-xs text-zinc-500">{row.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{row.categoryName}</td>
                    <td className="px-4 py-3 text-zinc-700">{intFmt.format(row.quantity)}</td>
                    <td className="px-4 py-3 text-zinc-700">{formatRwf(row.unitPrice)}</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">{formatRwf(row.stockValue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">No products found for current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
