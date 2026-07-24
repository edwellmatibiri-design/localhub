import { HIGH_RISK_CATEGORIES } from "@/lib/highRiskCategories";
import {
  categories,
  leads,
  listings,
  messages,
  sellerProfiles,
  suburbs,
} from "@/lib/mockData";
import type { Review } from "@/types";

const reviewStore: Review[] = [
  {
    id: "rev-1",
    reviewer_id: "user-1",
    seller_id: "seller-1",
    listing_id: "lst-1",
    rating: 5,
    comment: "Fast response and clean work.",
    created_at: new Date().toISOString(),
    verified_lead: true,
    verified_message: true,
    flagged: false,
    admin_notes: null,
  },
];

type TrustSnapshot = {
  sellerId: string;
  trustScore: number;
  reviewCount: number;
  lastReviewAt: string | null;
};

export function getReviews() {
  return reviewStore;
}

export function getReviewsForSeller(sellerId: string) {
  return reviewStore.filter((review) => review.seller_id === sellerId);
}

export function computeTrustScoreForSeller(sellerId: string): TrustSnapshot {
  const sellerReviews = reviewStore.filter(
    (review) => review.seller_id === sellerId,
  );
  if (sellerReviews.length === 0) {
    return { sellerId, trustScore: 0, reviewCount: 0, lastReviewAt: null };
  }

  const weighted = sellerReviews.reduce((acc, review) => {
    const weight = review.flagged ? 0.5 : 1;
    return acc + review.rating * weight;
  }, 0);

  const flaggedPenalty =
    sellerReviews.filter((review) => review.flagged).length * 0.1;
  const baseScore = weighted / sellerReviews.length;
  const trustScore = Math.max(
    0,
    Math.min(5, Number((baseScore - flaggedPenalty).toFixed(2))),
  );
  const lastReviewAt =
    sellerReviews
      .map((review) => review.created_at)
      .sort((a, b) => (a > b ? -1 : 1))[0] ?? null;

  const sellerProfile = sellerProfiles.find(
    (profile) => profile.id === sellerId,
  );
  if (sellerProfile) {
    sellerProfile.trust_score = trustScore;
    sellerProfile.review_count = sellerReviews.length;
    sellerProfile.last_review_at = lastReviewAt;
  }

  return {
    sellerId,
    trustScore,
    reviewCount: sellerReviews.length,
    lastReviewAt,
  };
}

export function findTopRatedSellers(
  categorySlug?: string,
  suburbSlug?: string,
) {
  return sellerProfiles
    .filter((seller) => {
      const listing = listings.find((item) => item.seller_id === seller.id);
      const category = categories.find(
        (item) => item.id === listing?.category_id,
      )?.slug;
      const suburb = suburbs.find(
        (item) => item.id === listing?.suburb_id,
      )?.slug;

      if (
        categorySlug &&
        !category?.toLowerCase().includes(categorySlug.toLowerCase())
      ) {
        return false;
      }

      if (
        suburbSlug &&
        !suburb?.toLowerCase().includes(suburbSlug.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .map((seller) => ({
      sellerId: seller.id,
      businessName: seller.business_name,
      trustScore: seller.trust_score,
      reviewCount: seller.review_count,
      trustBadge:
        seller.trust_score >= 4.5
          ? "Top Trusted"
          : seller.trust_score >= 4
            ? "Trusted"
            : "New",
    }))
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 5);
}

export function canUserReviewListing({
  reviewerId,
  sellerId,
  listingId,
}: {
  reviewerId: string;
  sellerId: string;
  listingId: string;
}) {
  const hasLead = leads.some(
    (lead) =>
      lead.user_id === reviewerId &&
      lead.seller_id === sellerId &&
      lead.listing_id === listingId,
  );
  const sellerUserId = sellerProfiles.find(
    (seller) => seller.id === sellerId,
  )?.user_id;
  const hasMessage = messages.some((message) => {
    const withSeller =
      message.sender_id === reviewerId
        ? message.receiver_id === sellerUserId
        : message.receiver_id === reviewerId &&
          message.sender_id === sellerUserId;

    return withSeller && message.listing_id === listingId;
  });

  return {
    hasLead,
    hasMessage,
    allowed: hasLead || hasMessage,
  };
}

export function reviewNeedsAdminApproval(listingId: string) {
  const listing = listings.find((candidate) => candidate.id === listingId);
  if (!listing) return false;

  const category =
    categories
      .find((item) => item.id === listing.category_id)
      ?.slug?.toLowerCase() ?? "";
  return HIGH_RISK_CATEGORIES.includes(
    category as (typeof HIGH_RISK_CATEGORIES)[number],
  );
}

export function createReview(review: Omit<Review, "id" | "created_at">) {
  const next: Review = {
    ...review,
    id: `rev-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  reviewStore.unshift(next);
  computeTrustScoreForSeller(next.seller_id);
  return next;
}

export function flagReview(
  id: string,
  flagged: boolean,
  adminNotes: string | null,
) {
  const review = reviewStore.find((candidate) => candidate.id === id);
  if (!review) return null;

  review.flagged = flagged;
  review.admin_notes = adminNotes;
  computeTrustScoreForSeller(review.seller_id);
  return review;
}

export function updateReviewAdmin(id: string, adminNotes: string | null) {
  const review = reviewStore.find((candidate) => candidate.id === id);
  if (!review) return null;

  review.admin_notes = adminNotes;
  computeTrustScoreForSeller(review.seller_id);
  return review;
}

sellerProfiles.forEach((seller) => {
  computeTrustScoreForSeller(seller.id);
});
