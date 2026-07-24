import VendorCard, { VendorCardSkeleton } from "@/components/vendors/VendorCard";

const demoVendors = [
  {
    name: "Apex Electrical Co.",
    category: "Electrical Services",
    rating: 4.9,
    reviewCount: 184,
    location: "Cape Town, Western Cape",
    profileImageUrl: "https://i.pravatar.cc/160?img=12",
    href: "/vendors/apex-electrical",
    tags: ["verified", "popular", "fast-response"] as const,
  },
  {
    name: "SwiftFix Plumbing",
    category: "Plumbing",
    rating: 4.7,
    reviewCount: 132,
    location: "Johannesburg, Gauteng",
    profileImageUrl: "https://i.pravatar.cc/160?img=22",
    href: "/vendors/swiftfix-plumbing",
    tags: ["verified", "fast-response"] as const,
  },
  {
    name: "BrightNest Cleaners",
    category: "Home Cleaning",
    rating: 4.8,
    reviewCount: 96,
    location: "Durban, KwaZulu-Natal",
    profileImageUrl: "https://i.pravatar.cc/160?img=32",
    href: "/vendors/brightnest-cleaners",
    tags: ["popular", "fast-response"] as const,
  },
  {
    name: "GreenLine Garden Pros",
    category: "Landscaping",
    rating: 4.6,
    reviewCount: 74,
    location: "Pretoria, Gauteng",
    profileImageUrl: "https://i.pravatar.cc/160?img=44",
    href: "/vendors/greenline-garden",
    tags: ["verified", "popular"] as const,
  },
  {
    name: "Prime Painters Studio",
    category: "Painting & Renovation",
    rating: 4.9,
    reviewCount: 211,
    location: "Port Elizabeth, Eastern Cape",
    profileImageUrl: "https://i.pravatar.cc/160?img=53",
    href: "/vendors/prime-painters",
    tags: ["verified", "popular", "fast-response"] as const,
  },
  {
    name: "SecureHome Installers",
    category: "Security Systems",
    rating: 4.5,
    reviewCount: 58,
    location: "Bloemfontein, Free State",
    profileImageUrl: "https://i.pravatar.cc/160?img=65",
    href: "/vendors/securehome-installers",
    tags: ["verified", "fast-response"] as const,
  },
];

export default function VendorCardDemoPage() {
  return (
    <main className="shell space-y-8 p-6 md:p-8">
      <header className="space-y-2">
        <p className="text-lh-accent text-xs font-semibold tracking-[0.14em] uppercase">
          Component Demo
        </p>
        <h1 className="text-lh-text-primary text-2xl font-semibold md:text-3xl">
          VendorCard Grid
        </h1>
        <p className="text-lh-text-secondary text-sm md:text-base">
          Responsive 6-card layout using dark-themed LocalHub tokens.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {demoVendors.map((vendor) => (
          <VendorCard key={vendor.href} {...vendor} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lh-text-primary text-lg font-semibold">Loading state</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <VendorCardSkeleton />
          <VendorCardSkeleton />
          <VendorCardSkeleton />
        </div>
      </section>
    </main>
  );
}