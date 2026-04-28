type CategoryOption = { id: string; name: string };

type ToolbarProps = {
  search: string;
  categoryId: string;
  sortBy: string;
  sortDir: string;
  categories: CategoryOption[];
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onSort: (value: string) => void;
  canManageProducts: boolean;
  onOpenCreate: () => void;
};

export function ProductsToolbar(props: Readonly<ToolbarProps>) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="ui-page-title ui-title-primary">Products</h1>
          <p className="ui-page-subtitle">Manage your inventory catalog and stock levels.</p>
        </div>
        {props.canManageProducts ? (
          <button className="ui-btn-primary h-10" onClick={props.onOpenCreate}>
            + Add Product
          </button>
        ) : null}
      </div>
      <div className="ui-glass p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input value={props.search} onChange={(e) => props.onSearch(e.target.value)} placeholder="Search by name or SKU" className="ui-input" />
          <select value={props.categoryId} onChange={(e) => props.onCategory(e.target.value)} className="ui-select">
            <option value="">Category: All</option>
            {props.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={`${props.sortBy}:${props.sortDir}`} onChange={(e) => props.onSort(e.target.value)} className="ui-select">
            <option value="createdAt:desc">Last Updated</option>
            <option value="name:asc">Name A-Z</option>
            <option value="price:desc">Price High-Low</option>
            <option value="quantity:asc">Stock Low-High</option>
          </select>
        </div>
      </div>
    </div>
  );
}
