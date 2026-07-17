import type { PropsWithChildren } from "react";
import Link from "next/link";

const nav = [
  { href: "/", label: "Marketplace" },
  { href: "/seller/dashboard", label: "Seller" },
  { href: "/user/dashboard", label: "User" },
  { href: "/admin/dashboard", label: "Admin" },
];

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="shell reveal">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-lh-border p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lh-electric-blue">LocalHub</p>
          <h1 className="text-xl font-semibold text-lh-charcoal">The Smart Marketplace</h1>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full border border-lh-border px-3 py-1.5 hover:border-lh-electric-blue">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="p-5">{children}</main>
    </div>
  );
}
