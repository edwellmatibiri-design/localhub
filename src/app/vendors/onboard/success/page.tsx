import Link from "next/link";

export default function VendorOnboardSuccessPage() {
  return (
    <section className="shell p-6">
      <div className="card mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Onboarding Complete</h1>
        <p className="text-lh-muted text-sm">
          Your vendor profile has been created and a baseline trust score was
          initialized.
        </p>
        <div className="flex gap-2">
          <Link
            href="/vendors/dashboard"
            className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
          >
            Go to Vendor Dashboard
          </Link>
          <Link
            href="/"
            className="border-lh-border rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
