import { appOk } from "@/lib/api";
import { computeTrustScoreForSeller, getReviews } from "@/lib/reviewTrust";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("seller_id");

  const reviews = getReviews().filter(
    (review) => !sellerId || review.seller_id === sellerId,
  );
  const trust = sellerId ? computeTrustScoreForSeller(sellerId) : null;

  return appOk({ reviews, trust });
}
