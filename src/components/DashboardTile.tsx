export default function DashboardTile({ label, value, tone = "blue" }: { label: string; value: string; tone?: "blue" | "green" | "amber"; }) {
  const toneClass = {
    blue: "border-lh-electric-blue/40 bg-lh-electric-blue/5",
    green: "border-lh-emerald/40 bg-lh-emerald/5",
    amber: "border-lh-amber/40 bg-lh-amber/10",
  }[tone];

  return (
    <div className={`card border ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.14em] text-lh-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-lh-charcoal">{value}</p>
    </div>
  );
}
