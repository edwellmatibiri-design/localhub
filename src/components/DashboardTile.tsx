export default function DashboardTile({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string;
  tone?: "blue" | "green" | "amber";
}) {
  const toneClass = {
    blue: "border-lh-accent/40 bg-lh-accent/5",
    green: "border-lh-emerald/40 bg-lh-emerald/5",
    amber: "border-lh-amber/40 bg-lh-amber/10",
  }[tone];

  return (
    <div className={`card border ${toneClass}`}>
      <p className="text-lh-muted text-xs tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="text-lh-text-primary mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}
