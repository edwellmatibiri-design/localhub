import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  keyword?: string;
};

type IntentNode = {
  id: string;
  keyword: string;
  intent: string;
  micro_intent: string | null;
  landing_path: string;
  score: number;
};

function toTrigrams(input: string) {
  const normalized = `  ${input.toLowerCase().trim().replace(/\s+/g, " ")}  `;
  const trigrams = new Set<string>();

  for (let index = 0; index <= normalized.length - 3; index += 1) {
    trigrams.add(normalized.slice(index, index + 3));
  }

  return trigrams;
}

function trigramSimilarity(a: string, b: string) {
  const aSet = toTrigrams(a);
  const bSet = toTrigrams(b);
  if (!aSet.size || !bSet.size) return 0;

  let overlap = 0;
  aSet.forEach((token) => {
    if (bSet.has(token)) overlap += 1;
  });

  return (2 * overlap) / (aSet.size + bSet.size);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const keyword = String(body.keyword ?? "").trim();
  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();

    const { data: exactMatches, error: exactError } = await supabase
      .from("intent_nodes")
      .select("id, keyword, intent, micro_intent, landing_path, score")
      .ilike("keyword", keyword)
      .order("score", { ascending: false })
      .limit(1);

    if (exactError) {
      return NextResponse.json({ error: exactError.message }, { status: 500 });
    }

    if ((exactMatches ?? []).length > 0) {
      const canonicalIntent = (exactMatches ?? [])[0] as IntentNode;
      return NextResponse.json({
        canonicalIntentId: canonicalIntent.id,
        canonicalIntent,
      });
    }

    const { data: partialMatches, error: partialError } = await supabase
      .from("intent_nodes")
      .select("id, keyword, intent, micro_intent, landing_path, score")
      .ilike("keyword", `%${keyword}%`)
      .order("score", { ascending: false })
      .limit(25);

    if (partialError) {
      return NextResponse.json(
        { error: partialError.message },
        { status: 500 },
      );
    }

    if ((partialMatches ?? []).length > 0) {
      const canonicalIntent = (partialMatches ?? [])[0] as IntentNode;
      return NextResponse.json({
        canonicalIntentId: canonicalIntent.id,
        canonicalIntent,
      });
    }

    // Trigram fallback in app code (used if DB trigram extension/index is unavailable).
    const { data: fallbackCandidates, error: fallbackError } = await supabase
      .from("intent_nodes")
      .select("id, keyword, intent, micro_intent, landing_path, score")
      .limit(200);

    if (fallbackError) {
      return NextResponse.json(
        { error: fallbackError.message },
        { status: 500 },
      );
    }

    let bestNode: IntentNode | null = null;
    let bestSimilarity = -1;

    (fallbackCandidates ?? []).forEach((node) => {
      const similarity = trigramSimilarity(keyword, String(node.keyword ?? ""));
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestNode = node as IntentNode;
      }
    });

    if (!bestNode || bestSimilarity <= 0) {
      return NextResponse.json({
        canonicalIntentId: null,
        canonicalIntent: null,
      });
    }

    const canonicalIntent = bestNode as IntentNode;

    return NextResponse.json({
      canonicalIntentId: canonicalIntent.id,
      canonicalIntent,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to resolve canonical intent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
