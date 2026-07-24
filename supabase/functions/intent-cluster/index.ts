// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type KeywordRow = {
  keyword: string;
  landing_path: string;
};

function detectIntent(keyword: string): string {
  const normalized = keyword.toLowerCase();
  if (normalized.includes("emergency") || normalized.includes("urgent")) return "emergency";
  if (normalized.includes("price") || normalized.includes("cost") || normalized.includes("quote")) return "price";
  if (normalized.includes("best") || normalized.includes("top") || normalized.includes("rated")) return "best-rated";
  return "general";
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ ok: false, error: "Missing Supabase env vars" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRole);
  const payload = (await request.json().catch(() => ({}))) as { keywords?: KeywordRow[] };
  const keywords = payload.keywords ?? [];

  if (keywords.length === 0) {
    return new Response(JSON.stringify({ ok: true, clustered: 0 }), { status: 200 });
  }

  const rows = keywords.map((row) => {
    const intent = detectIntent(row.keyword);
    return {
      keyword: row.keyword,
      intent,
      micro_intent: intent === "general" ? null : intent,
      landing_path: row.landing_path,
      score: intent === "general" ? 0.55 : 0.9,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from("intent_nodes").upsert(rows, {
    onConflict: "keyword,intent,micro_intent",
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, clustered: rows.length }), { status: 200 });
});
