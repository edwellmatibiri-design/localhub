import DashboardMaster from "@/components/DashboardMaster";
import LeadCard from "@/components/LeadCard";
import SellerTrustBadge from "@/components/reviews/SellerTrustBadge";
import ReviewList from "@/components/reviews/ReviewList";
import { CreateListingForm } from "@/app/seller/listing/CreateListingForm";
import { EditListingForm } from "@/app/seller/listing/EditListingForm";
import { listings } from "@/lib/mockData";
import { getReviewsForSeller } from "@/lib/reviewTrust";
import { leads } from "@/lib/mockData";

export default function SellerDashboardPage() {
  const reviews = getReviewsForSeller("seller-1");
  const editableListing = listings[0];

  return (
    <div className="space-y-4">
      <DashboardMaster />
      <div className="grid gap-4 lg:grid-cols-2">
        <CreateListingForm />
        <EditListingForm listing={editableListing} />
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </section>
      <SellerTrustBadge sellerId="seller-1" />
      <ReviewList reviews={reviews} title="Recent Seller Reviews" />
    </div>
  );
}
