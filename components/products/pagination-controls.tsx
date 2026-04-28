type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  /** Defaults to "products" */
  itemLabel?: string;
};

export function PaginationControls(props: PaginationProps) {
  const from = props.total ? (props.page - 1) * props.pageSize + 1 : 0;
  const to = Math.min(props.page * props.pageSize, props.total);
  return (
    <div className="flex items-center justify-between rounded border border-zinc-200 bg-white px-4 py-3">
      <p className="text-sm text-zinc-500">
        Showing {from} to {to} of {props.total}{" "}
        {props.itemLabel ?? "products"}
      </p>
      <div className="flex items-center gap-2">
        <button disabled={props.page <= 1} onClick={() => props.onPage(props.page - 1)} className="rounded border border-zinc-200 px-3 py-1 text-sm disabled:opacity-40">
          Previous
        </button>
        <span className="rounded bg-[#0058be] px-3 py-1 text-sm text-white">{props.page}</span>
        <button disabled={props.page >= props.totalPages} onClick={() => props.onPage(props.page + 1)} className="rounded border border-zinc-200 px-3 py-1 text-sm disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}
