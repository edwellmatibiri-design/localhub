"use client";

import { useCallback, useState } from "react";
import { getCanonicalIntent, getRelatedIntents } from "@/lib/intent/graph";

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

type RankedVendor = {
  vendorId: string;
  listingId: string;
  trustScore: number;
  freshnessScore: number;
  reviewVolume: number;
  internalLinkCount: number;
  recencyPenalty: number;
  rankingScore: number;
  badge: "gold" | "silver" | "bronze" | "none";
  listingTitle?: string;
  listingDescription?: string;
  vendorName?: string;
  averageRating?: number;
  serviceCategories?: string[];
  priceRange?: string;
};

type GeneratedPageSummary = {
  intentId: string;
  title: string;
  metaDescription: string;
  h1: string;
};

type MarketplaceRankingData = {
  canonicalIntent: CanonicalIntent | null;
  relatedIntents: RelatedIntent[];
  generatedPage: GeneratedPageSummary | null;
  rankedVendors: RankedVendor[];
};

export function useMarketplaceRanking(keyword: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MarketplaceRankingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    const normalizedKeyword = String(keyword ?? "").trim();
    if (!normalizedKeyword) {
      setError("Please enter a keyword.");
      setData(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const canonicalRes = await getCanonicalIntent(normalizedKeyword);
      const canonicalIntent = (canonicalRes?.canonicalIntent ??
        null) as CanonicalIntent | null;

      if (!canonicalIntent?.id) {
        setData({
          canonicalIntent: null,
          relatedIntents: [],
          generatedPage: null,
          rankedVendors: [],
        });
        setError("No canonical intent found for that keyword.");
        return null;
      }

      const [relatedRes, pageRes, rankRes] = await Promise.all([
        getRelatedIntents(canonicalIntent.id),
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
        (relatedRes?.relatedIntents ?? []) as RelatedIntent[]
      ).slice(0, 8);

      const pagePayload = await pageRes.json();
      if (!pageRes.ok) {
        throw new Error(
          String(pagePayload?.error ?? "Failed to fetch generated page"),
        );
      }

      const rankPayload = await rankRes.json();
      if (!rankRes.ok) {
        throw new Error(
          String(rankPayload?.error ?? "Failed to fetch ranking"),
        );
      }

      const generatedPage: GeneratedPageSummary | null = {
        intentId: String(pagePayload?.intentId ?? canonicalIntent.id),
        title: String(pagePayload?.title ?? ""),
        metaDescription: String(pagePayload?.metaDescription ?? ""),
        h1: String(pagePayload?.h1 ?? ""),
      };

      const rankedVendors = (rankPayload?.ranked ?? []) as RankedVendor[];

      const nextData: MarketplaceRankingData = {
        canonicalIntent,
        relatedIntents,
        generatedPage,
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
  }, [keyword]);

  return {
    loading,
    data,
    error,
    search,
  };
}
