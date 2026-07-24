import Link from "next/link";

type SearchParams = {
  quoteId?: string;
};

export default async function QuoteConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <section className="shell p-6">
      <div className="card mx-auto max-w-xl space-y-3">
        <h1 className="text-2xl font-semibold">Quote Request Sent</h1>
        <p className="text-lh-muted text-sm">
          Your request has been sent to the vendor. They can accept or reject it
          from their quote inbox.
        </p>
        {params.quoteId && (
          <p className="text-lh-muted text-sm">Quote ID: {params.quoteId}</p>
        )}
        <div className="flex gap-2">
          <Link
            href="/account/dashboard"
            className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/search"
            className="border-lh-border rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Continue browsing
          </Link>
        </div>
      </div>
    </section>
  );
}
