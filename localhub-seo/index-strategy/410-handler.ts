export type ListingStatus = "active" | "expired" | "deleted";

export type DeindexDecision = {
  statusCode: 200 | 410;
  shouldDeindex: boolean;
  reason: string;
};

export function getDeindexDecision(status: ListingStatus): DeindexDecision {
  if (status === "expired" || status === "deleted") {
    return {
      statusCode: 410,
      shouldDeindex: true,
      reason: "Listing is not active and should be removed from index",
    };
  }

  return {
    statusCode: 200,
    shouldDeindex: false,
    reason: "Listing is active",
  };
}
