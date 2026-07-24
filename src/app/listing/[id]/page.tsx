import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import SeoListingPage from "@/components/SeoListingPage";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
import SellerTrustBadge from "@/components/reviews/SellerTrustBadge";
import { getReviewsForSeller } from "@/lib/reviewTrust";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reviews = getReviewsForSeller("seller-1");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SeoListingPage listingTitle={`Listing ${id}`} />
        <LeadForm />
      </div>
      <SellerTrustBadge sellerId="seller-1" />
      <ReviewForm sellerId="seller-1" listingId={id} />
      <ReviewList reviews={reviews} title="Seller Reviews" />
    </div>
  );
}
