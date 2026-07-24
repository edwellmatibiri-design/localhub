import type { Metadata } from "next";
import SeoCategoryPage from "@/components/SeoCategoryPage";
import ReviewList from "@/components/reviews/ReviewList";
import { getReviews } from "@/lib/reviewTrust";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const reviews = getReviews().slice(0, 3);

  return (
    <div className="space-y-4">
      <SeoCategoryPage slug={category} />
      <ReviewList reviews={reviews} title="Trust Signals" />
    </div>
  );
}
