"use client";

import { useCallback, useState } from "react";
import { useIntentGraph } from "@/app/hooks/useIntentGraph";

type CanonicalIntent = {
  id: string;
  keyword: string;
  intent: string;
  landing_path: string;
};

type RelatedIntent = {
  id: string;
  keyword: string;
  intent: string;
  landing_path: string;
};

type GeneratedPageSummary = {
  intentId: string;
  title: string;
  metaDescription: string;
  h1: string;
};

type RankedVendor = {
  listingId: string;
  listingTitle: string;
  listingDescription: string;
  vendorId: string;
  score: number;
  vendorTrustScore: number;
  freshnessScore: number;
  reviewVolume: number;
  internalLinkCount: number;
  explanation: string;
  badge?: string;
};

type SearchData = {
  canonicalIntent: CanonicalIntent | null;
  relatedIntents: RelatedIntent[];
  pageSummary: GeneratedPageSummary | null;
  rankedVendors: RankedVendor[];
};

export function useSearch(keyword: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { fetchCanonical, fetchRelated } = useIntentGraph();

  const search = useCallback(async () => {
    const normalizedKeyword = String(keyword ?? "").trim();
    if (!normalizedKeyword) {
      setData(null);
      setError("Please enter a keyword.");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const canonicalResult = await fetchCanonical(normalizedKeyword);
      const canonicalIntent = (canonicalResult?.canonicalIntent ??
        null) as CanonicalIntent | null;

      if (!canonicalIntent?.id) {
        setData({
          canonicalIntent: null,
          relatedIntents: [],
          pageSummary: null,
          rankedVendors: [],
        });
        setError("No canonical intent found for that keyword.");
        return null;
      }

      const [relatedResult, generatedPageResponse, rankedResponse] =
        await Promise.all([
          fetchRelated(canonicalIntent.id),
          fetch("/api/page/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intentId: canonicalIntent.id }),
          }),
          fetch("/api/search/rank", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intentId: canonicalIntent.id }),
          }),
        ]);

      const relatedIntents = (
        (relatedResult?.relatedIntents ?? []) as RelatedIntent[]
      ).slice(0, 8);

      const generatedPayload = await generatedPageResponse.json();
      if (!generatedPageResponse.ok) {
        throw new Error(
          String(generatedPayload?.error ?? "Failed to fetch generated page"),
        );
      }

      const rankedPayload = await rankedResponse.json();
      if (!rankedResponse.ok) {
        throw new Error(
          String(rankedPayload?.error ?? "Failed to rank vendors"),
        );
      }

      const pageSummary: GeneratedPageSummary | null = {
        intentId: String(generatedPayload?.intentId ?? canonicalIntent.id),
        title: String(
          generatedPayload?.title ?? rankedPayload?.page?.title ?? "",
        ),
        metaDescription: String(
          generatedPayload?.metaDescription ??
            rankedPayload?.page?.metaDescription ??
            "",
        ),
        h1: String(generatedPayload?.h1 ?? rankedPayload?.page?.h1 ?? ""),
      };

      const rankedVendors = (
        (rankedPayload?.results ?? []) as RankedVendor[]
      ).map((item) => ({
        ...item,
        badge: item.badge ?? "none",
      }));

      const nextData: SearchData = {
        canonicalIntent,
        relatedIntents,
        pageSummary,
        rankedVendors,
      };

      setData(nextData);
      return nextData;
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Search failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCanonical, fetchRelated, keyword]);

  return {
    loading,
    data,
    error,
    search,
  };
}
