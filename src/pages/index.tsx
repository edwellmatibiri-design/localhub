import Link from "next/link";
import Layout from "@/components/Layout";
import CardListing from "@/components/CardListing";
import DashboardMaster from "@/components/DashboardMaster";
import { listings } from "@/lib/mockData";

export default function Home() {
  return (
    <Layout>
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="card bg-gradient-to-br from-lh-electric-blue/10 via-white to-lh-emerald/10">
            <p className="badge bg-lh-emerald/15 text-lh-emerald">Where Local Meets AI</p>
            <h2 className="mt-3 text-3xl font-semibold text-lh-charcoal">South Africa's autonomous marketplace</h2>
            <p className="mt-3 max-w-2xl text-sm text-lh-muted">
              AI-generated listings, no-KYC onboarding (email or phone only), real-time messaging, lead flow, and automated SEO cycles.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link href="/auth/onboarding-method" className="rounded-lg bg-lh-electric-blue px-4 py-2 font-medium text-white">
                Get Started
              </Link>
              <Link href="/seller/dashboard" className="rounded-lg border border-lh-border px-4 py-2 font-medium">
                Seller Dashboard
              </Link>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {listings.map((listing) => (
              <CardListing key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
        <DashboardMaster />
      </section>
    </Layout>
  );
}
