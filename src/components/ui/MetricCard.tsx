interface MetricCardProps {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "success" | "warning";
}

export function MetricCard({
  label,
  value,
  tone = "default",
}: MetricCardProps) {
  const toneClass =
    tone === "danger"
      ? "text-lh-danger"
      : tone === "success"
        ? "text-lh-success"
        : tone === "warning"
          ? "text-lh-warning"
          : "text-lh-text-primary";

  return (
    <div className="border-lh-border bg-lh-surface-soft shadow-lh-inner rounded-2xl border p-4">
      <p className="text-lh-text-secondary mb-1 text-xs tracking-wide uppercase">
        {label}
      </p>
      <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
