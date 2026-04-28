export function ActivityLogsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 bg-[#f2f5ff] px-4 py-3">
        <div className="h-4 w-36 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 px-4 py-4 md:gap-4">
            <div className="col-span-12 md:col-span-3 space-y-2">
              <div className="h-4 max-w-[180px] w-[70%] animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="col-span-4 md:col-span-2 h-6 w-20 animate-pulse rounded-full bg-zinc-100" />
            <div className="col-span-4 md:col-span-2 h-6 w-20 animate-pulse rounded-full bg-zinc-100" />
            <div className="col-span-4 md:col-span-2 h-4 w-28 animate-pulse rounded bg-zinc-100" />
            <div className="col-span-12 md:col-span-3 h-4 w-44 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
