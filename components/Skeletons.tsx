export function SkeletonListCard() {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#243049] p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 bg-slate-200 dark:bg-[#243049] rounded w-3/4" />
        <div className="h-5 w-5 bg-slate-200 dark:bg-[#243049] rounded shrink-0" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <div className="h-3 bg-slate-200 dark:bg-[#243049] rounded w-16" />
          <div className="h-3 bg-slate-200 dark:bg-[#243049] rounded w-8" />
        </div>
        <div className="h-2 bg-slate-100 dark:bg-[#1a2336] rounded-full w-full">
          <div className="h-2 bg-slate-200 dark:bg-[#243049] rounded-full w-1/3" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="h-4 bg-slate-200 dark:bg-[#243049] rounded-full w-16" />
        <div className="h-4 bg-slate-200 dark:bg-[#243049] rounded w-16" />
      </div>
    </div>
  );
}

export function SkeletonTermItem() {
  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#243049] rounded-xl p-4 flex gap-4 animate-pulse">
      <div className="flex-1 grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-[#243049] rounded w-16" />
          <div className="h-4 bg-slate-200 dark:bg-[#243049] rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-[#243049] rounded w-2/3" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-[#243049] rounded w-16" />
          <div className="h-4 bg-slate-200 dark:bg-[#243049] rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-[#243049] rounded w-3/4" />
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-2 shrink-0">
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 bg-slate-200 dark:bg-[#243049] rounded" />
          <div className="h-5 w-5 bg-slate-200 dark:bg-[#243049] rounded-full" />
          <div className="h-6 w-6 bg-slate-200 dark:bg-[#243049] rounded" />
        </div>
        <div className="flex gap-1">
          <div className="h-6 w-6 bg-slate-200 dark:bg-[#243049] rounded" />
          <div className="h-6 w-6 bg-slate-200 dark:bg-[#243049] rounded" />
        </div>
      </div>
    </div>
  );
}
