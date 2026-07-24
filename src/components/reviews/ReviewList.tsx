import type { Review } from "@/types";
import ReviewCard from "@/components/reviews/ReviewCard";

export default function ReviewList({
  reviews,
  title = "Reviews",
}: {
  reviews: Review[];
  title?: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {reviews.length === 0 && (
        <p className="card text-lh-muted text-sm">No reviews yet.</p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={{
              rating: Number(review.rating ?? 0),
              review: String(review.comment ?? ""),
              created_at: String(review.created_at ?? new Date().toISOString()),
              verified: Boolean(
                review.verified_lead || review.verified_message,
              ),
            }}
          />
        ))}
      </div>
    </section>
  );
}
