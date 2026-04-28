import type { ActivityLogListItem } from "@/types/activity-logs";
import { ActivityLogsTableSkeleton } from "@/components/activity-logs/activity-logs-table-skeleton";

const dtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type Props = {
  rows: ActivityLogListItem[];
  loading: boolean;
};

function actionLabel(action: ActivityLogListItem["action"]) {
  return action.replace("_", " ").toLowerCase();
}

function entityLabel(entity: ActivityLogListItem["entity"]) {
  return entity.charAt(0) + entity.slice(1).toLowerCase();
}

function actionClass(action: ActivityLogListItem["action"]) {
  if (action === "CREATE") return "bg-blue-50 text-blue-800 ring-blue-200";
  if (action === "UPDATE") return "bg-indigo-50 text-indigo-800 ring-indigo-200";
  if (action === "DELETE") return "bg-rose-50 text-rose-800 ring-rose-200";
  return "bg-blue-50 text-blue-800 ring-blue-200";
}

export function ActivityLogsTable({ rows, loading }: Readonly<Props>) {
  if (loading) return <ActivityLogsTableSkeleton />;

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-sm font-medium text-zinc-900">No activity logs found</p>
        <p className="mt-2 text-sm text-zinc-500">
          Adjust filters or continue using the app to generate audit events.
        </p>
      </div>
    );
  }

  return (
    <div className="ui-table-shell">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h2 className="ui-title-primary text-sm">Audit timeline</h2>
      </div>
      <table className="min-w-full text-sm">
        <thead className="ui-table-head">
          <tr>
            {["User", "Action", "Entity", "Entity ID", "Timestamp"].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-100">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{row.userName}</p>
                <p className="text-xs text-zinc-500">{row.userEmail}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${actionClass(
                    row.action,
                  )}`}
                >
                  {actionLabel(row.action)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                {entityLabel(row.entity)}
              </td>
              <td className="max-w-[260px] px-4 py-3">
                <span className="truncate font-mono text-xs text-zinc-600">
                  {row.entityId}
                </span>
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
