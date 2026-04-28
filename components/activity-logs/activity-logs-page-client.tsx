"use client";

import { PaginationControls } from "@/components/products/pagination-controls";
import { ActivityLogsTable } from "@/components/activity-logs/activity-logs-table";
import { ActivityLogsToolbar } from "@/components/activity-logs/activity-logs-toolbar";
import { useActivityLogsData } from "@/components/activity-logs/use-activity-logs-data";

export function ActivityLogsPageClient() {
  const { query, setQuery, result, loading, error } = useActivityLogsData();

  return (
    <div className="space-y-6">
      <ActivityLogsToolbar
        search={query.search}
        action={query.action}
        entity={query.entity}
        dateFrom={query.dateFrom}
        dateTo={query.dateTo}
        sortDir={query.sortDir}
        onSearch={(search) => setQuery((q) => ({ ...q, page: 1, search }))}
        onAction={(action) => setQuery((q) => ({ ...q, page: 1, action }))}
        onEntity={(entity) => setQuery((q) => ({ ...q, page: 1, entity }))}
        onDateFrom={(dateFrom) => setQuery((q) => ({ ...q, page: 1, dateFrom }))}
        onDateTo={(dateTo) => setQuery((q) => ({ ...q, page: 1, dateTo }))}
        onSortDir={(sortDir) => setQuery((q) => ({ ...q, page: 1, sortDir }))}
      />

      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <ActivityLogsTable rows={result.items} loading={loading} />

      {!loading && result.total > 0 ? (
        <PaginationControls
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          pageSize={result.pageSize}
          onPage={(page) => setQuery((q) => ({ ...q, page }))}
          itemLabel="logs"
        />
      ) : null}
    </div>
  );
}
