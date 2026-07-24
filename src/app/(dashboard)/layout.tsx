import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/intent", label: "Intent Graph" },
  { href: "/pages", label: "Page Generator" },
  { href: "/freshness", label: "Freshness" },
  { href: "/crawl", label: "Crawl Optimizer" },
  { href: "/vendors", label: "Vendor Trust" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell grid min-h-[calc(100vh-3rem)] grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-lh-border border-b p-4 md:border-r md:border-b-0">
        <h2 className="text-lh-muted text-sm font-semibold tracking-wide uppercase">
          Navigation
        </h2>
        <nav className="mt-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-lh-border hover:border-lh-accent hover:text-lh-accent block rounded-lg border px-3 py-2 text-sm font-medium transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0">
        <header className="border-lh-border border-b px-5 py-4">
          <h1 className="text-lh-text-primary text-xl font-semibold">
            LocalHub Control
          </h1>
        </header>
        <section className="p-5">{children}</section>
      </main>
    </div>
  );
}
