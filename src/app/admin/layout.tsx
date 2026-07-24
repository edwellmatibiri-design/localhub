import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/intents", label: "Intents" },
  { href: "/admin/pages", label: "Generated Pages" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/freshness", label: "Freshness" },
  { href: "/admin/crawl", label: "Crawl Budget" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell grid min-h-[calc(100vh-3rem)] grid-cols-1 md:grid-cols-[250px_1fr]">
      <aside className="border-lh-border border-b p-4 md:border-r md:border-b-0">
        <h2 className="text-lh-muted text-sm font-semibold tracking-wide uppercase">
          Admin Menu
        </h2>
        <nav className="mt-3 space-y-2">
          {links.map((item) => (
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

      <main>
        <header className="border-lh-border border-b px-5 py-4">
          <h1 className="text-lh-text-primary text-xl font-semibold">
            LocalHub Marketplace - Admin
          </h1>
        </header>
        <section className="p-5">{children}</section>
      </main>
    </div>
  );
}
