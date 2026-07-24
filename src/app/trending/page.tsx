import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Trending Local Searches - LocalHub",
  description: "See what services people are searching for right now.",
};

export default async function TrendingSearchesPage() {
  const supabase = createServiceClient();

  let intents: Array<{
    id: string;
    keyword: string;
    search_count?: number;
    score?: number;
  }> = [];

  const withSearchCount = await supabase
    .from("intent_nodes")
    .select("id, keyword, search_count")
    .order("search_count", { ascending: false })
    .limit(30);

  if (withSearchCount.error) {
    const fallback = await supabase
      .from("intent_nodes")
      .select("id, keyword, score")
      .order("score", { ascending: false })
      .limit(30);

    intents = (fallback.data ?? []) as Array<{
      id: string;
      keyword: string;
      score?: number;
    }>;
  } else {
    intents = (withSearchCount.data ?? []) as Array<{
      id: string;
      keyword: string;
      search_count?: number;
    }>;
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Trending Searches</h1>
      {intents.length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">
            No trending searches available yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {intents.map((intent) => (
            <Link
              key={intent.id}
              href={`/search?keyword=${encodeURIComponent(intent.keyword)}`}
              className="card hover:border-lh-accent/40"
            >
              <p className="font-medium">{intent.keyword}</p>
              <p className="text-lh-muted mt-1 text-xs">
                {(intent as { search_count?: number }).search_count != null
                  ? `Searches: ${Number((intent as { search_count?: number }).search_count)}`
                  : `Score: ${Number((intent as { score?: number }).score ?? 0).toFixed(2)}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
