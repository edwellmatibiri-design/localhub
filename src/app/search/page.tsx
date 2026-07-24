"use client";

import { useMemo } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMarketplaceRanking } from "@/app/hooks/useMarketplaceRanking";
import ListingCard from "@/components/listings/ListingCard";
import SearchBar from "@/components/search/SearchBar";
import RelatedIntents from "@/components/search/RelatedIntents";
import VendorCard from "@/components/vendors/VendorCard";
import { createClient } from "@/lib/db";

function isVagueQuery(keyword: string) {
  const normalized = String(keyword ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length <= 2) return true;
  const broadTerms = ["service", "help", "best", "options", "near me"];
  return broadTerms.some((term) => normalized === term);
}

function isBestOptionQuestion(keyword: string) {
  return /what'?s the best option|best option|best service|best vendor/i.test(
    String(keyword ?? ""),
  );
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKeyword = String(searchParams.get("keyword") ?? "").trim();

  const [keyword, setKeyword] = useState(queryKeyword);
  const { loading, data, error, search } = useMarketplaceRanking(keyword);
  const [expanded, setExpanded] = useState<
    Array<{ keyword: string; confidence: number }>
  >([]);
  const [sponsoredAds, setSponsoredAds] = useState<
    Array<{
      adId: number;
      vendorId: string;
      vendorName: string;
      bidAmount: number;
      target?: string | null;
    }>
  >([]);
  const [recommendedGuides, setRecommendedGuides] = useState<
    Array<{
      id: number;
      title: string;
      slug: string;
      summary: string;
      category?: string | null;
    }>
  >([]);
  const [userTier, setUserTier] = useState<
    "bronze" | "silver" | "gold" | "platinum"
  >("bronze");
  const [aiSessionId, setAiSessionId] = useState<number | null>(null);
  const [aiConciergeReply, setAiConciergeReply] = useState<string>("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setKeyword(queryKeyword);
  }, [queryKeyword]);

  useEffect(() => {
    if (!queryKeyword || keyword !== queryKeyword) {
      return;
    }

    async function runSearchFlow() {
      let userId = "";
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        userId = String(auth?.user?.id ?? "");
        if (userId) {
          await fetch("/api/behaviour/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              type: "search",
              metadata: { keyword: queryKeyword },
            }),
          });
        }
      } catch {
        // Keep search resilient if behaviour logging fails.
      }

      if (isVagueQuery(queryKeyword) || isBestOptionQuestion(queryKeyword)) {
        try {
          const aiResponse = await fetch("/api/ai/router", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: aiSessionId,
              message: queryKeyword,
              role: "user",
              userId,
            }),
          });
          const aiPayload = await aiResponse.json();
          if (aiResponse.ok && aiPayload?.ok) {
            setAiSessionId(Number(aiPayload.sessionId));
            setAiConciergeReply(String(aiPayload.reply ?? ""));
            setAiSuggestions((aiPayload.suggestions ?? []) as string[]);
          } else {
            setAiConciergeReply("");
            setAiSuggestions([]);
          }
        } catch {
          setAiConciergeReply("");
          setAiSuggestions([]);
        }
      } else {
        setAiConciergeReply("");
        setAiSuggestions([]);
      }

      const adsResponse = await fetch("/api/ads/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement: "search",
          keyword: queryKeyword,
          intent: queryKeyword,
          limit: 3,
        }),
      });

      const adsPayload = await adsResponse.json();
      if (adsResponse.ok && adsPayload?.ok) {
        setSponsoredAds(
          (adsPayload?.ads ?? []) as Array<{
            adId: number;
            vendorId: string;
            vendorName: string;
            bidAmount: number;
            target?: string | null;
          }>,
        );
      } else {
        setSponsoredAds([]);
      }

      await search();
    }

    void runSearchFlow();
  }, [keyword, queryKeyword, search]);

  useEffect(() => {
    let canceled = false;

    async function loadUserTier() {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const userId = String(auth?.user?.id ?? "");
        if (!userId) return;

        const response = await fetch("/api/loyalty/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        const payload = await response.json();
        if (!response.ok || canceled || !payload?.ok) return;
        const tierValue = String(payload.tier ?? "bronze") as
          | "bronze"
          | "silver"
          | "gold"
          | "platinum";
        setUserTier(tierValue);
      } catch {
        // No-op: search page should still render even when loyalty lookup fails.
      }
    }

    void loadUserTier();
    return () => {
      canceled = true;
    };
  }, []);

  async function openSponsoredAd(adId: number, vendorId: string) {
    try {
      await fetch("/api/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
      });
    } finally {
      router.push(`/vendors/${vendorId}`);
    }
  }

  useEffect(() => {
    const canonicalKeyword = String(
      data?.canonicalIntent?.keyword ?? queryKeyword,
    ).trim();
    if (!canonicalKeyword) {
      setExpanded([]);
      return;
    }

    let canceled = false;
    async function loadExpansion() {
      const response = await fetch("/api/intent/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: canonicalKeyword }),
      });

      const payload = await response.json();
      if (!response.ok || canceled) {
        return;
      }

      setExpanded(
        (payload?.expanded ?? []) as Array<{
          keyword: string;
          confidence: number;
        }>,
      );
    }

    void loadExpansion();
    return () => {
      canceled = true;
    };
  }, [data?.canonicalIntent?.keyword, queryKeyword]);

  const peopleAlsoSearched = expanded.slice(0, 6);
  const similarServices = expanded.slice(6, 12);

  useEffect(() => {
    const inferredCategory = String(
      data?.rankedVendors?.[0]?.serviceCategories?.[0] ?? "",
    )
      .trim()
      .toLowerCase();
    if (!inferredCategory && !queryKeyword) {
      setRecommendedGuides([]);
      return;
    }

    let canceled = false;
    async function loadGuides() {
      const response = await fetch("/api/content/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: inferredCategory || queryKeyword,
          location: "",
        }),
      });
      const payload = await response.json();
      if (!response.ok || canceled) {
        return;
      }

      setRecommendedGuides(
        (payload?.relatedGuides ?? []) as Array<{
          id: number;
          title: string;
          slug: string;
          summary: string;
          category?: string | null;
        }>,
      );
    }

    void loadGuides();
    return () => {
      canceled = true;
    };
  }, [data?.rankedVendors, queryKeyword]);

  const vendorCards = useMemo(() => {
    const map = new Map<
      string,
      {
        vendorId: string;
        businessName: string;
        trustBadge: "gold" | "silver" | "bronze" | "none";
        averageRating: number;
        serviceCategories: string[];
      }
    >();

    (data?.rankedVendors ?? []).forEach((item) => {
      if (map.has(item.vendorId)) {
        return;
      }

      map.set(item.vendorId, {
        vendorId: item.vendorId,
        businessName: item.vendorName ?? "Vendor",
        trustBadge: item.badge,
        averageRating: Number(item.averageRating ?? 0),
        serviceCategories: item.serviceCategories ?? [],
      });
    });

    return Array.from(map.values());
  }, [data?.rankedVendors]);

  return (
    <section className="shell p-6">
      <div className="space-y-4">
        <SearchBar
          keyword={keyword}
          loading={loading}
          onKeywordChange={setKeyword}
          onSearch={() => void search()}
        />
        {(aiConciergeReply || aiSuggestions.length > 0) && (
          <section className="card border-lh-accent space-y-2 border-l-4">
            <h3 className="text-base font-semibold">AI Search Concierge</h3>
            {aiConciergeReply && (
              <p className="text-sm whitespace-pre-wrap">{aiConciergeReply}</p>
            )}
            {aiSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((suggestion) => (
                  <Link
                    key={suggestion}
                    href={`/ai?prompt=${encodeURIComponent(suggestion)}`}
                    className="border-lh-border rounded border px-2 py-1 text-xs"
                  >
                    {suggestion}
                  </Link>
                ))}
              </div>
            )}
            <Link
              href={`/ai?prompt=${encodeURIComponent(`Help me with search: ${queryKeyword}`)}`}
              className="text-lh-accent text-xs font-medium hover:underline"
            >
              Open full AI concierge
            </Link>
          </section>
        )}
        <section className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="border-lh-border flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold">
              U
            </div>
            <div>
              <p className="text-lh-muted text-xs">Loyalty Tier</p>
              <p className="text-sm font-medium capitalize">{userTier}</p>
            </div>
          </div>
          <span className="badge capitalize">{userTier} badge</span>
        </section>
        {error && <p className="card text-lh-danger text-sm">{error}</p>}

        <section className="card space-y-2">
          <h3 className="text-base font-semibold">Main Result</h3>
          {!data?.generatedPage ? (
            <p className="text-lh-muted text-sm">
              No generated page summary yet.
            </p>
          ) : (
            <>
              <p className="badge bg-lh-accent/10 text-lh-accent">
                Intent {data.generatedPage.intentId}
              </p>
              <h4 className="text-xl font-semibold">
                {data.generatedPage.title}
              </h4>
              <p className="text-lh-muted text-sm">
                {data.generatedPage.metaDescription}
              </p>
              <p className="text-sm">{data.generatedPage.h1}</p>
            </>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold">Sponsored</h3>
          {sponsoredAds.length === 0 ? (
            <div className="card">
              <p className="text-lh-muted text-sm">
                No sponsored ads for this search.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {sponsoredAds.map((ad) => (
                <article
                  key={ad.adId}
                  className="card border-lh-accent space-y-2 border-l-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{ad.vendorName}</p>
                    <span className="badge bg-lh-warning/20 text-lh-warning">
                      Ad badge
                    </span>
                  </div>
                  <p className="text-lh-muted text-xs">Sponsored</p>
                  <p className="text-lh-muted text-xs">
                    Bid: R {Number(ad.bidAmount).toLocaleString("en-ZA")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void openSponsoredAd(ad.adId, ad.vendorId)}
                    className="border-lh-border rounded border px-3 py-1 text-sm"
                  >
                    View sponsored vendor
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold">Vendors</h3>
          {vendorCards.length === 0 ? (
            <div className="card">
              <p className="text-lh-muted text-sm">No vendor matches yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {vendorCards.map((vendor) => (
                <VendorCard
                  key={vendor.vendorId}
                  vendorId={vendor.vendorId}
                  businessName={vendor.businessName}
                  trustBadge={vendor.trustBadge}
                  averageRating={vendor.averageRating}
                  serviceCategories={vendor.serviceCategories}
                  userTier={userTier}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold">Listings</h3>
          {(data?.rankedVendors ?? []).length === 0 ? (
            <div className="card">
              <p className="text-lh-muted text-sm">No listing matches yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(data?.rankedVendors ?? []).map((listing) => (
                <ListingCard
                  key={`${listing.listingId}-${listing.vendorId}`}
                  listingId={listing.listingId}
                  title={listing.listingTitle ?? "Listing"}
                  vendorId={listing.vendorId}
                  vendorName={listing.vendorName ?? "Vendor"}
                  trustBadge={listing.badge}
                  priceRange={listing.priceRange ?? "Contact for pricing"}
                  earnPoints={50}
                />
              ))}
            </div>
          )}
        </section>

        <RelatedIntents intents={data?.relatedIntents ?? []} />

        <section className="card space-y-3">
          <h3 className="text-base font-semibold">People Also Searched</h3>
          {peopleAlsoSearched.length === 0 ? (
            <p className="text-lh-muted text-sm">No related trends yet.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {peopleAlsoSearched.map((item) => (
                <a
                  key={`also-${item.keyword}`}
                  href={`/search?keyword=${encodeURIComponent(item.keyword)}`}
                  className="border-lh-border hover:border-lh-accent/40 rounded-lg border px-3 py-2"
                >
                  <p className="text-sm font-medium">{item.keyword}</p>
                  <p className="text-lh-muted text-xs">
                    Confidence: {(item.confidence * 100).toFixed(0)}%
                  </p>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="card space-y-3">
          <h3 className="text-base font-semibold">Similar Services Near You</h3>
          {similarServices.length === 0 ? (
            <p className="text-lh-muted text-sm">
              No nearby similar services yet.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {similarServices.map((item) => (
                <a
                  key={`similar-${item.keyword}`}
                  href={`/search?keyword=${encodeURIComponent(item.keyword)}`}
                  className="border-lh-border hover:border-lh-accent/40 rounded-lg border px-3 py-2"
                >
                  <p className="text-sm font-medium">{item.keyword}</p>
                  <p className="text-lh-muted text-xs">
                    Confidence: {(item.confidence * 100).toFixed(0)}%
                  </p>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="card space-y-3">
          <h3 className="text-base font-semibold">Helpful Guides</h3>
          {recommendedGuides.length === 0 ? (
            <p className="text-lh-muted text-sm">No guides yet.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {recommendedGuides.slice(0, 6).map((guide) => (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug}`}
                  className="border-lh-border hover:border-lh-accent/40 rounded-lg border px-3 py-2"
                >
                  <p className="text-sm font-medium">{guide.title}</p>
                  <p className="text-lh-muted text-xs">{guide.summary}</p>
                </Link>
              ))}
            </div>
          )}

          {recommendedGuides[0]?.category && (
            <div className="grid gap-2 md:grid-cols-2">
              <Link
                href={`/guides?category=${encodeURIComponent(String(recommendedGuides[0].category ?? "").toLowerCase())}`}
                className="border-lh-border hover:border-lh-accent/40 rounded-lg border px-3 py-2"
              >
                <p className="text-sm font-medium">
                  How to choose a {recommendedGuides[0].category} provider
                </p>
              </Link>
              <Link
                href={`/guides?category=${encodeURIComponent(String(recommendedGuides[0].category ?? "").toLowerCase())}`}
                className="border-lh-border hover:border-lh-accent/40 rounded-lg border px-3 py-2"
              >
                <p className="text-sm font-medium">
                  Pricing guide for {recommendedGuides[0].category} services
                </p>
              </Link>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
