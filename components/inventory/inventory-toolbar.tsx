type CategoryOption = { id: string; name: string };

type Props = {
  search: string;
  categoryId: string;
  sortBy: string;
  sortDir: string;
  categories: CategoryOption[];
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onSort: (value: string) => void;
};

export function InventoryToolbar(props: Readonly<Props>) {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="ui-page-title ui-title-primary">Inventory</h1>
        <p className="ui-page-subtitle">
          Monitor stock levels and record stock-in or stock-out transactions.
        </p>
      </div>
      <div className="ui-glass p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            placeholder="Search by name or SKU"
            className="ui-input"
          />
          <select
            value={props.categoryId}
            onChange={(e) => props.onCategory(e.target.value)}
            className="ui-select"
          >
            <option value="">All categories</option>
            {props.categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={`${props.sortBy}:${props.sortDir}`}
            onChange={(e) => props.onSort(e.target.value)}
            className="ui-select"
          >
            <option value="quantity:asc">Stock: low → high</option>
            <option value="quantity:desc">Stock: high → low</option>
            <option value="name:asc">Name A–Z</option>
            <option value="createdAt:desc">Recently added</option>
          </select>
        </div>
      </div>
    </div>
  );
}
