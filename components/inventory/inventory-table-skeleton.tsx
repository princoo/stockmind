export function InventoryTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 bg-[#f2f5ff] px-4 py-3">
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="h-6 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-6 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="flex gap-2">
              <div className="h-9 w-16 animate-pulse rounded-md bg-zinc-100" />
              <div className="h-9 w-16 animate-pulse rounded-md bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
