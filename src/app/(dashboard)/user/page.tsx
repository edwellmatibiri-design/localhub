import DashboardMaster from "@/components/DashboardMaster";
import CardListing from "@/components/CardListing";
import MessagesInbox from "@/components/MessagesInbox";
import MessagesThread from "@/components/MessagesThread";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
import SellerTrustBadge from "@/components/reviews/SellerTrustBadge";
import CardPage from "@/components/CardPage";
import { getReviews } from "@/lib/reviewTrust";
import { listings } from "@/lib/mockData";

export default function UserDashboardPage() {
  const reviews = getReviews();

  return (
    <div className="space-y-4">
      <DashboardMaster />
      <CardPage title="User Profile">
        Manage account details, onboarding role, and notification preferences.
      </CardPage>
      <div className="grid gap-4 lg:grid-cols-2">
        <MessagesInbox />
        <MessagesThread />
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        {listings.map((listing) => (
          <CardListing key={listing.id} listing={listing} />
        ))}
      </section>
      <SellerTrustBadge sellerId="seller-1" />
      <ReviewForm sellerId="seller-1" listingId="lst-1" />
      <ReviewList reviews={reviews} title="Marketplace Reviews" />
    </div>
  );
}
