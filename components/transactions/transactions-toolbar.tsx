type Props = {
  search: string;
  type: "" | "STOCK_IN" | "STOCK_OUT";
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDir: string;
  onSearch: (value: string) => void;
  onType: (value: "" | "STOCK_IN" | "STOCK_OUT") => void;
  onDateFrom: (value: string) => void;
  onDateTo: (value: string) => void;
  onSort: (value: string) => void;
};

export function TransactionsToolbar(props: Readonly<Props>) {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="ui-page-title ui-title-primary">Transactions</h1>
        <p className="ui-page-subtitle">
          Read-only log of stock-in and stock-out movements from inventory.
        </p>
      </div>
      <div className="ui-glass p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          <input
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            placeholder="Search by product name"
            className="ui-input lg:col-span-2"
          />
          <select
            value={props.type}
            onChange={(e) =>
              props.onType(e.target.value as "" | "STOCK_IN" | "STOCK_OUT")
            }
            className="ui-select"
          >
            <option value="">All types</option>
            <option value="STOCK_IN">Stock in</option>
            <option value="STOCK_OUT">Stock out</option>
          </select>
          <input
            type="date"
            value={props.dateFrom}
            onChange={(e) => props.onDateFrom(e.target.value)}
            className="ui-input"
            aria-label="From date"
          />
          <input
            type="date"
            value={props.dateTo}
            onChange={(e) => props.onDateTo(e.target.value)}
            className="ui-input"
            aria-label="To date"
          />
          <select
            value={`${props.sortBy}:${props.sortDir}`}
            onChange={(e) => props.onSort(e.target.value)}
            className="ui-select"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="quantity:desc">Quantity high → low</option>
            <option value="quantity:asc">Quantity low → high</option>
          </select>
        </div>
      </div>
    </div>
  );
}
