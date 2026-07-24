type TrendPoint = {
  label: string;
  value: number;
};

type TrendGraphProps = {
  points: TrendPoint[];
  colorClass?: string;
};

export default function TrendGraph({
  points,
  colorClass = "bg-lh-accent/70",
}: TrendGraphProps) {
  const safe = points.length > 0 ? points : [{ label: "No data", value: 0 }];
  const max = Math.max(
    ...safe.map((point) => Math.max(0, Number(point.value) || 0)),
    1,
  );

  return (
    <div className="space-y-2">
      <div className="border-lh-border bg-lh-surface grid h-44 grid-cols-12 items-end gap-2 rounded-lg border p-3">
        {safe.slice(-12).map((point, index) => {
          const value = Math.max(0, Number(point.value) || 0);
          const height = Math.max(6, Math.round((value / max) * 100));
          return (
            <div
              key={`${point.label}-${index}`}
              className={`rounded-t ${colorClass}`}
              style={{ height: `${height}%` }}
              title={`${point.label}: ${value}`}
            />
          );
        })}
      </div>
      <div className="text-lh-muted flex justify-between text-[10px]">
        <span>{safe[0]?.label ?? ""}</span>
        <span>{safe[safe.length - 1]?.label ?? ""}</span>
      </div>
    </div>
  );
}
