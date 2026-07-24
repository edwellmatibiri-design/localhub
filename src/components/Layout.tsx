import type { PropsWithChildren } from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

const nav = [
  { href: "/", label: "Marketplace" },
  { href: "/seller", label: "Seller" },
  { href: "/user", label: "User" },
  { href: "/admin", label: "Admin" },
];

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="shell reveal">
      <header className="border-lh-border flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <div>
          <p className="text-lh-accent text-xs font-semibold tracking-[0.2em] uppercase">
            LocalHub Marketplace
          </p>
          <h1 className="text-lh-text-primary text-xl font-semibold">
            Trusted local services and bookings
          </h1>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-lh-border hover:border-lh-accent rounded-full border px-3 py-1.5"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="p-5">{children}</main>
      <Footer />
    </div>
  );
}
