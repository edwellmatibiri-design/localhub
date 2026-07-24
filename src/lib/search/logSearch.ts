import { createServiceClient } from "@/lib/db";

type SearchType = "category" | "location" | "vendor" | "listing" | "intent";

const recentSearches: Array<{ keyword: string; at: number }> = [];

function normalizeKeyword(keyword: string) {
  return String(keyword ?? "")
    .trim()
    .toLowerCase();
}

export function getRecentSearches() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return recentSearches.filter((entry) => entry.at >= cutoff);
}

export async function logSearch(params: {
  intentId?: string | null;
  keyword: string;
  suggestionType?: SearchType;
}) {
  const supabase = createServiceClient();
  const keyword = normalizeKeyword(params.keyword);
  if (!keyword) return;

  recentSearches.push({ keyword, at: Date.now() });
  while (recentSearches.length > 500) {
    recentSearches.shift();
  }

  if (params.intentId) {
    const rpcResult = await supabase.rpc("increment_intent_search_count", {
      intent_id_param: params.intentId,
    });
    if (rpcResult.error) {
      const { data: row } = await supabase
        .from("intent_nodes")
        .select("search_count")
        .eq("id", params.intentId)
        .maybeSingle();
      const current = Number(row?.search_count ?? 0);
      await supabase
        .from("intent_nodes")
        .update({ search_count: current + 1 })
        .eq("id", params.intentId);
    }
  }

  const type = params.suggestionType ?? "intent";
  const { data: existing } = await supabase
    .from("search_suggestions")
    .select("id, score")
    .eq("keyword", keyword)
    .eq("type", type)
    .maybeSingle();

  if (!existing) {
    await supabase
      .from("search_suggestions")
      .insert({ keyword, type, score: 1 });
    return;
  }

  await supabase
    .from("search_suggestions")
    .update({
      score: Number(existing.score ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
}
