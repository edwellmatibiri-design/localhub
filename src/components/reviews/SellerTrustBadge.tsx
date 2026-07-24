import { computeTrustScoreForSeller } from "@/lib/reviewTrust";

export default function SellerTrustBadge({ sellerId }: { sellerId: string }) {
  const trust = computeTrustScoreForSeller(sellerId);

  return (
    <section className="card flex items-center justify-between">
      <div>
        <p className="text-lh-muted text-xs tracking-[0.16em] uppercase">
          Seller Trust Score
        </p>
        <h3 className="text-lh-text-primary mt-1 text-2xl font-semibold">
          {trust.trustScore.toFixed(2)} / 5.00
        </h3>
      </div>
      <div className="text-lh-muted text-right text-sm">
        <p>{trust.reviewCount} reviews</p>
        <p>
          {trust.lastReviewAt
            ? `Updated ${new Date(trust.lastReviewAt).toLocaleDateString()}`
            : "No reviews yet"}
        </p>
      </div>
    </section>
  );
}
