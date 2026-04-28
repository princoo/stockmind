type Props = {
  search: string;
  action: "" | "CREATE" | "UPDATE" | "DELETE";
  entity: "" | "PRODUCT" | "CATEGORY" | "SUPPLIER" | "USER";
  dateFrom: string;
  dateTo: string;
  sortDir: string;
  onSearch: (value: string) => void;
  onAction: (value: Props["action"]) => void;
  onEntity: (value: Props["entity"]) => void;
  onDateFrom: (value: string) => void;
  onDateTo: (value: string) => void;
  onSortDir: (value: "asc" | "desc") => void;
};

export function ActivityLogsToolbar(props: Readonly<Props>) {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="ui-page-title ui-title-primary">Activity Logs</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Review a chronological record of system and user actions.
        </p>
      </div>
      <div className="ui-glass p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          <input
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            placeholder="Search by user name or entity ID"
            className="ui-input lg:col-span-2"
          />
          <select
            value={props.action}
            onChange={(e) => props.onAction(e.target.value as Props["action"])}
            className="ui-select"
          >
            <option value="">All actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
          <select
            value={props.entity}
            onChange={(e) => props.onEntity(e.target.value as Props["entity"])}
            className="ui-select"
          >
            <option value="">All entities</option>
            <option value="PRODUCT">Product</option>
            <option value="CATEGORY">Category</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="USER">User</option>
          </select>
          <input
            type="date"
            value={props.dateFrom}
            onChange={(e) => props.onDateFrom(e.target.value)}
            className="ui-input"
            aria-label="From date"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={props.dateTo}
              onChange={(e) => props.onDateTo(e.target.value)}
              className="ui-input min-w-0 flex-1"
              aria-label="To date"
            />
            <select
              value={props.sortDir}
              onChange={(e) => props.onSortDir(e.target.value as "asc" | "desc")}
              className="ui-select"
              aria-label="Sort by date"
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
