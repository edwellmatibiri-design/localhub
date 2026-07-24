import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function ChartCard({
  title,
  subtitle,
  children,
}: ChartCardProps) {
  return (
    <section className="card space-y-3">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-lh-muted text-xs">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
