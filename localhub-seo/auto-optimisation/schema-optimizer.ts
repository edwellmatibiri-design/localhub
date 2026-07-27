export type RatingInput = {
  averageRating: number;
  ratingCount: number;
};

export type OptimisedSchemaFields = {
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
};

export function optimiseSchema(input: RatingInput): OptimisedSchemaFields {
  if (input.ratingCount < 3 || input.averageRating <= 0) {
    return {};
  }

  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number(input.averageRating.toFixed(2)),
      reviewCount: input.ratingCount,
    },
  };
}
