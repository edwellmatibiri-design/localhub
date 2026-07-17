import Link from "next/link";
import Layout from "@/components/Layout";

export default function OnboardingMethodPage() {
  return (
    <Layout>
      <section className="card">
        <h2 className="text-2xl font-semibold">Choose Sign-up Method</h2>
        <p className="mt-2 text-sm text-lh-muted">LocalHub supports email or phone authentication only. No KYC required.</p>
        <div className="mt-4 flex gap-2">
          <Link href="/auth/signup-email" className="rounded-lg bg-lh-electric-blue px-4 py-2 text-sm font-medium text-white">Email</Link>
          <Link href="/auth/signup-phone" className="rounded-lg border border-lh-border px-4 py-2 text-sm font-medium">Phone</Link>
        </div>
      </section>
    </Layout>
  );
}
