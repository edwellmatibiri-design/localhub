"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/db";
import ReviewCard from "@/components/reviews/ReviewCard";

type ReviewsSectionProps = {
  vendorId: string;
};

type ReviewRow = {
  id: number;
  rating: number;
  review: string;
  created_at: string;
  verified: boolean;
};

export default function ReviewsSection({ vendorId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 5;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: reviewsError } = await supabase
          .from("reviews")
          .select("id, rating, review, created_at, verified")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false });

        if (reviewsError) {
          throw reviewsError;
        }

        setReviews((data ?? []) as ReviewRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [vendorId]);

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0
      ? 0
      : reviews.reduce((sum, row) => sum + (Number(row.rating) || 0), 0) /
        reviewCount;

  const recentReviews = useMemo(() => {
    const threshold = Date.now() - 90 * 24 * 60 * 60 * 1000;
    return reviews.filter((row) => {
      const parsed = Date.parse(String(row.created_at));
      return !Number.isNaN(parsed) && parsed >= threshold;
    }).length;
  }, [reviews]);

  const totalPages = Math.max(1, Math.ceil(reviewCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = reviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <button
          type="button"
          className="border-lh-border text-lh-text-primary rounded-lg border px-3 py-1 text-sm font-medium"
        >
          Write a Review
        </button>
      </div>
      <p className="text-lh-muted text-sm">
        Average rating: {averageRating.toFixed(1)}
      </p>
      <p className="text-lh-muted text-sm">Total reviews: {reviewCount}</p>
      <p className="text-lh-muted text-sm">
        Recent reviews (90 days): {recentReviews}
      </p>

      {loading ? (
        <p className="text-lh-muted text-sm">Loading reviews...</p>
      ) : error ? (
        <p className="text-lh-danger text-sm">{error}</p>
      ) : paginated.length === 0 ? (
        <p className="text-lh-muted text-sm">No reviews yet.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {paginated.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage <= 1}
              className="border-lh-border rounded border px-2 py-1 text-xs disabled:opacity-50"
            >
              Prev
            </button>
            <p className="text-lh-muted text-xs">
              Page {currentPage} of {totalPages}
            </p>
            <button
              type="button"
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              disabled={currentPage >= totalPages}
              className="border-lh-border rounded border px-2 py-1 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
