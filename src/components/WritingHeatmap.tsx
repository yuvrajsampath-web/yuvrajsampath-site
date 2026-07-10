function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function WritingHeatmap({ dates }: { dates: string[] }) {
  if (dates.length === 0) return null;

  const dateSet = new Set(dates);
  const sorted = [...dates].sort();
  const start = new Date(sorted[0] + "T00:00:00");
  const end = new Date();

  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const days: { date: string; active: boolean }[] = [];
  for (let d = new Date(gridStart); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISO(d);
    days.push({ date: iso, active: dateSet.has(iso) });
  }

  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const daySpan = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((d) => (
                <div
                  key={d.date}
                  title={d.date}
                  className={`h-[10px] w-[10px] rounded-[2px] ${d.active ? "bg-amber" : "bg-line"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        {dates.length} entries across {daySpan.toLocaleString("en-IN")} days, since{" "}
        {start.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
