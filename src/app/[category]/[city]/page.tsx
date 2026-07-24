import type { Metadata } from "next";
import SeoCategorySuburbPage from "@/components/SeoCategorySuburbPage";
import ReviewList from "@/components/reviews/ReviewList";
import SellerTrustBadge from "@/components/reviews/SellerTrustBadge";
import { getReviews } from "@/lib/reviewTrust";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CategoryCityPage({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}) {
  const { category, city } = await params;
  const reviews = getReviews().slice(0, 5);

  return (
    <div className="space-y-4">
      <SeoCategorySuburbPage category={category} suburb={city} />
      <SellerTrustBadge sellerId="seller-1" />
      <ReviewList reviews={reviews} title="Top Rated in this Area" />
    </div>
  );
}
