interface BadgeProps {
  label: string;
  tone?: "default" | "success" | "danger" | "warning";
}

export function Badge({ label, tone = "default" }: BadgeProps) {
  const toneClass =
    tone === "success"
      ? "bg-lh-success/10 text-lh-success"
      : tone === "danger"
        ? "bg-lh-danger/10 text-lh-danger"
        : tone === "warning"
          ? "bg-lh-warning/10 text-lh-warning"
          : "bg-lh-surface-soft text-lh-text-secondary";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${toneClass}`}
    >
      {label}
    </span>
  );
}
