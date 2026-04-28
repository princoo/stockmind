"use client";

import { PaginationControls } from "@/components/products/pagination-controls";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionsToolbar } from "@/components/transactions/transactions-toolbar";
import { useTransactionsData } from "@/components/transactions/use-transactions-data";

export function TransactionsPageClient() {
  const { query, setQuery, result, loading, error } = useTransactionsData();

  const setSort = (value: string) => {
    const [sortBy, sortDir] = value.split(":");
    setQuery((q) => ({ ...q, page: 1, sortBy, sortDir }));
  };

  return (
    <div className="space-y-6">
      <TransactionsToolbar
        search={query.search}
        type={query.type}
        dateFrom={query.dateFrom}
        dateTo={query.dateTo}
        sortBy={query.sortBy}
        sortDir={query.sortDir}
        onSearch={(search) => setQuery((q) => ({ ...q, page: 1, search }))}
        onType={(type) => setQuery((q) => ({ ...q, page: 1, type }))}
        onDateFrom={(dateFrom) => setQuery((q) => ({ ...q, page: 1, dateFrom }))}
        onDateTo={(dateTo) => setQuery((q) => ({ ...q, page: 1, dateTo }))}
        onSort={setSort}
      />

      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <TransactionsTable rows={result.items} loading={loading} />

      {!loading && result.total > 0 ? (
        <PaginationControls
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          onPage={(page) => setQuery((q) => ({ ...q, page }))}
          itemLabel="transactions"
        />
      ) : null}
    </div>
  );
}
