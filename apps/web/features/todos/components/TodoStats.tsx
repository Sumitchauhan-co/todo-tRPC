interface TodoStatsProps {
  total: number;
  active: number;
  completed: number;
}

export function TodoStats({ total, active, completed }: TodoStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-md border border-[#1f3427]/10 bg-white/70 p-4">
        <p className="text-sm text-[#68715f]">Total</p>
        <p className="mt-2 text-3xl font-semibold">{total}</p>
      </div>
      <div className="rounded-md border border-[#1f3427]/10 bg-white/70 p-4">
        <p className="text-sm text-[#68715f]">Active</p>
        <p className="mt-2 text-3xl font-semibold">{active}</p>
      </div>
      <div className="rounded-md border border-[#1f3427]/10 bg-white/70 p-4">
        <p className="text-sm text-[#68715f]">Finished</p>
        <p className="mt-2 text-3xl font-semibold">{completed}</p>
      </div>
    </div>
  );
}