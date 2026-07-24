import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <section
      className={`border-lh-border bg-lh-surface shadow-lh-soft rounded-2xl border p-6 ${className}`}
    >
      {children}
    </section>
  );
}
