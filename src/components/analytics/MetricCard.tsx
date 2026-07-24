type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export default function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <article className="card border-lh-border/80 bg-lh-surface/90 border">
      <p className="text-lh-muted text-xs tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="text-lh-text-primary mt-2 text-2xl font-semibold">
        {value}
      </p>
      {hint && <p className="text-lh-muted mt-1 text-xs">{hint}</p>}
    </article>
  );
}
