type Props = {
  trust: number;
  freshness: number;
  reviews: number;
  internalLinks: number;
  recency: number;
  rankingScore: number;
};

export default function RankingExplanation({
  trust,
  freshness,
  reviews,
  internalLinks,
  recency,
  rankingScore,
}: Props) {
  return (
    <div className="border-lh-border text-lh-muted rounded-lg border p-2 text-xs">
      <p>Trust: {Math.round(trust)}</p>
      <p>Freshness: {Math.round(freshness)}</p>
      <p>Reviews: {reviews}</p>
      <p>Internal links: {internalLinks}</p>
      <p>Recency penalty: {Math.round(recency)}</p>
      <p className="text-lh-text-primary mt-1 font-medium">
        Final score: {rankingScore}
      </p>
    </div>
  );
}
