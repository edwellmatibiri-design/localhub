"use client";

import RankingExplanation from "@/components/RankingExplanation";

type VendorResult = {
  listingId: string;
  listingTitle?: string;
  listingDescription?: string;
  vendorId: string;
  trustScore: number;
  freshnessScore: number;
  reviewVolume: number;
  internalLinkCount: number;
  recencyPenalty: number;
  rankingScore: number;
  badge?: string;
};

type GeneratedPageSummary = {
  intentId: string;
  title: string;
  metaDescription: string;
  h1: string;
};

type Props = {
  summary: GeneratedPageSummary | null;
  vendors: VendorResult[];
};

export default function ResultsList({ summary, vendors }: Props) {
  return (
    <div className="space-y-4">
      <section className="card space-y-2">
        <h3 className="text-base font-semibold">Main Result</h3>
        {!summary ? (
          <p className="text-lh-muted text-sm">
            No generated page summary yet.
          </p>
        ) : (
          <>
            <p className="badge bg-lh-accent/10 text-lh-accent">
              Intent {summary.intentId}
            </p>
            <h4 className="text-xl font-semibold">{summary.title}</h4>
            <p className="text-lh-muted text-sm">{summary.metaDescription}</p>
            <p className="text-sm">{summary.h1}</p>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Ranked Vendors</h3>
        {vendors.length === 0 ? (
          <div className="card">
            <p className="text-lh-muted text-sm">No vendor matches yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {vendors.map((vendor) => (
              <article
                key={`${vendor.listingId}-${vendor.vendorId}`}
                className="card space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold">{vendor.listingTitle}</h4>
                  <span className="badge bg-lh-emerald/15 text-lh-emerald capitalize">
                    {vendor.badge ?? "none"}
                  </span>
                </div>
                <p className="text-lh-muted text-sm">
                  {vendor.listingDescription ?? "No description"}
                </p>
                <p className="text-lh-muted text-xs">
                  Vendor: {vendor.vendorId}
                </p>
                <p className="text-sm font-medium">
                  Rank score: {vendor.rankingScore}
                </p>
                <RankingExplanation
                  trust={vendor.trustScore}
                  freshness={vendor.freshnessScore}
                  reviews={vendor.reviewVolume}
                  internalLinks={vendor.internalLinkCount}
                  recency={vendor.recencyPenalty}
                  rankingScore={vendor.rankingScore}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
