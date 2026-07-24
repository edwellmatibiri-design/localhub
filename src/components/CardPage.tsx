import type { PropsWithChildren } from "react";

export default function CardPage({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <section className="card">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-lh-muted mt-3 text-sm">{children}</div>
    </section>
  );
}
