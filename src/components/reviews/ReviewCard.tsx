type ReviewCardModel = {
  rating: number;
  review: string;
  created_at: string;
  verified: boolean;
};

function stars(value: number) {
  const count = Math.max(1, Math.min(5, Math.round(value)));
  return "★".repeat(count) + "☆".repeat(5 - count);
}

export default function ReviewCard({ review }: { review: ReviewCardModel }) {
  return (
    <article className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-lh-muted text-xs tracking-[0.16em] uppercase">
          Rating
        </p>
        <p
          className="font-semibold"
          aria-label={`Rating ${review.rating} out of 5`}
        >
          {stars(review.rating)}
        </p>
      </div>
      <p className="text-lh-muted text-sm">{review.review}</p>
      <div className="text-lh-muted flex flex-wrap items-center gap-2 text-xs">
        <span>{new Date(review.created_at).toLocaleDateString()}</span>
        {review.verified && (
          <span className="badge bg-lh-emerald/15 text-lh-emerald">
            Verified Booking
          </span>
        )}
      </div>
    </article>
  );
}
