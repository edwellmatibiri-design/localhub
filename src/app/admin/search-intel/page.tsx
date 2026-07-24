import { createServiceClient } from "@/lib/db";
import SearchIntelClient from "@/components/admin/SearchIntelClient";
import { computeTrendingKeywords } from "@/lib/search/trending";

export const dynamic = "force-dynamic";

export default async function AdminSearchIntelPage() {
  const supabase = createServiceClient();

  const [{ data: topSearched }, { data: suggestions }, trending] =
    await Promise.all([
      supabase
        .from("intent_nodes")
        .select("id, keyword, search_count")
        .order("search_count", { ascending: false })
        .limit(100),
      supabase
        .from("search_suggestions")
        .select("id, keyword, type, score, updated_at")
        .order("score", { ascending: false })
        .limit(200),
      computeTrendingKeywords(20),
    ]);

  return (
    <section className="shell p-6">
      <SearchIntelClient
        topSearched={
          (topSearched ?? []) as Array<{
            id: string;
            keyword: string;
            search_count: number;
          }>
        }
        trending={trending}
        suggestions={
          (suggestions ?? []) as Array<{
            id: number;
            keyword: string;
            type: "category" | "location" | "vendor" | "listing" | "intent";
            score: number;
            updated_at: string;
          }>
        }
      />
    </section>
  );
}
