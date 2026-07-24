type DistributionBucket = {
  label: string;
  value: number;
};

type DistributionGraphProps = {
  buckets: DistributionBucket[];
};

export default function DistributionGraph({ buckets }: DistributionGraphProps) {
  const safe = buckets.length > 0 ? buckets : [{ label: "0", value: 0 }];
  const max = Math.max(
    ...safe.map((item) => Math.max(0, Number(item.value) || 0)),
    1,
  );

  return (
    <ul className="space-y-2">
      {safe.map((bucket) => {
        const value = Math.max(0, Number(bucket.value) || 0);
        const width = Math.max(4, Math.round((value / max) * 100));
        return (
          <li
            key={bucket.label}
            className="grid grid-cols-[80px_1fr_48px] items-center gap-2 text-xs"
          >
            <span className="text-lh-muted">{bucket.label}</span>
            <div className="bg-lh-surface-soft h-2 rounded">
              <div
                className="bg-lh-amber/80 h-2 rounded"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="text-lh-text-primary text-right">{value}</span>
          </li>
        );
      })}
    </ul>
  );
}
