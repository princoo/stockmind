"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import type { DashboardData } from "@/types/dashboard";

type ApiResponse = DashboardData | { message?: string };

const numberFmt = new Intl.NumberFormat();
const shortDateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="h-3 w-24 rounded bg-zinc-200" />
      <div className="mt-3 h-7 w-20 rounded bg-zinc-200" />
      <div className="mt-2 h-3 w-32 rounded bg-zinc-100" />
    </div>
  );
}

export function DashboardPageClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        const payload = (await res.json().catch(() => null)) as ApiResponse | null;
        if (!res.ok) throw new Error((payload && "message" in payload && payload.message) || "Failed to load dashboard.");
        if (!active) return;
        setData(payload as DashboardData);
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const trendChartData = useMemo(
    () =>
      (data?.stockTrend ?? []).map((p) => ({
        ...p,
        label: shortDateFmt.format(new Date(`${p.date}T00:00:00.000Z`)),
      })),
    [data],
  );
  const transactionSkeletonRows = ["tx-sk-1", "tx-sk-2", "tx-sk-3", "tx-sk-4", "tx-sk-5", "tx-sk-6"];
  const lowStockSkeletonRows = ["ls-sk-1", "ls-sk-2", "ls-sk-3", "ls-sk-4", "ls-sk-5", "ls-sk-6"];

  const recentTransactionsBody = (() => {
    if (loading || !data) {
      return transactionSkeletonRows.map((key) => (
        <tr key={key} className="border-t border-zinc-100">
          <td className="px-4 py-3"><div className="h-3 w-32 animate-pulse rounded bg-zinc-100" /></td>
          <td className="px-4 py-3"><div className="h-3 w-14 animate-pulse rounded bg-zinc-100" /></td>
          <td className="px-4 py-3"><div className="h-3 w-8 animate-pulse rounded bg-zinc-100" /></td>
          <td className="px-4 py-3"><div className="h-3 w-24 animate-pulse rounded bg-zinc-100" /></td>
          <td className="px-4 py-3"><div className="h-3 w-24 animate-pulse rounded bg-zinc-100" /></td>
        </tr>
      ));
    }
    if (!data.recentTransactions.length) {
      return (
        <tr>
          <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
            No transactions yet.
          </td>
        </tr>
      );
    }
    return data.recentTransactions.map((row) => (
      <tr key={row.id} className="border-t border-zinc-100">
        <td className="px-4 py-3">
          <p className="font-medium text-zinc-900">{row.productName}</p>
          <p className="font-mono text-xs text-zinc-500">{row.productSku}</p>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${row.type === "STOCK_IN" ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"}`}>
            {row.type === "STOCK_IN" ? "Stock In" : "Stock Out"}
          </span>
        </td>
        <td className={`px-4 py-3 font-semibold ${row.type === "STOCK_IN" ? "text-blue-700" : "text-rose-700"}`}>
          {row.type === "STOCK_IN" ? "+" : "-"}
          {row.quantity}
        </td>
        <td className="px-4 py-3 text-zinc-700">{row.userName}</td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
          {dateTimeFmt.format(new Date(row.createdAt))}
        </td>
      </tr>
    ));
  })();

  const lowStockBody = (() => {
    if (loading || !data) {
      return lowStockSkeletonRows.map((key) => (
        <div key={key} className="px-4 py-3">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-100" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-100" />
        </div>
      ));
    }
    if (!data.lowStockProducts.length) {
      return (
        <div className="px-4 py-10 text-center text-sm text-zinc-500">
          No low-stock products right now.
        </div>
      );
    }
    return data.lowStockProducts.map((row) => (
      <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900">{row.name}</p>
          <p className="font-mono text-xs text-zinc-500">{row.sku}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-amber-700">{row.quantity} in stock</p>
          <p className="text-xs text-zinc-500">Threshold {row.lowStockThreshold}</p>
        </div>
      </div>
    ));
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ui-page-title ui-title-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Real-time overview of stock health and inventory movement.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !data ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Total products</p>
              <p className="mt-2 text-3xl font-semibold text-blue-900">{numberFmt.format(data.summary.totalProducts)}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Total stock quantity</p>
              <p className="mt-2 text-3xl font-semibold text-blue-900">{numberFmt.format(data.summary.totalStockQuantity)}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Low stock items</p>
              <p className="mt-2 text-3xl font-semibold text-amber-900">{numberFmt.format(data.summary.lowStockItemsCount)}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Total transactions</p>
              <p className="mt-2 text-3xl font-semibold text-blue-900">{numberFmt.format(data.summary.totalTransactions)}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="ui-title-primary text-sm">Stock trend (last 30 days)</h2>
          <div className="mt-4 h-72">
            {loading || !data ? (
              <div className="h-full animate-pulse rounded bg-zinc-100" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="netColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0058be" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0058be" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={24} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="net" stroke="#0058be" fill="url(#netColor)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="ui-title-primary text-sm">Stock-in vs stock-out</h2>
          <div className="mt-4 h-72">
            {loading || !data ? (
              <div className="h-full animate-pulse rounded bg-zinc-100" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={24} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stockIn" name="Stock In" fill="#0b63cf" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stockOut" name="Stock Out" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="ui-title-primary text-sm">Recent transactions</h2>
            <Link
              href="/transactions"
              className="text-xs font-semibold text-[#0058be] hover:text-[#004ca3]"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto pb-4">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f2f5ff] text-left text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  {["Product", "Type", "Qty", "User", "Time"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{recentTransactionsBody}</tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="ui-title-primary text-sm">Low stock products</h2>
            <Link
              href="/products"
              className="text-xs font-semibold text-[#0058be] hover:text-[#004ca3]"
            >
              View all products
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 pb-4">{lowStockBody}</div>
        </section>
      </div>
    </div>
  );
}
