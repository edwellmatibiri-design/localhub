import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  keyword?: string;
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const keyword = String(body.keyword ?? "").trim();
  if (!keyword) {
    return NextResponse.json({ expanded: [] });
  }

  try {
    const supabase = createServiceClient();

    const { data: baseNode } = await supabase
      .from("intent_nodes")
      .select("id, keyword")
      .ilike("keyword", keyword)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();

    const expansions = new Map<string, number>();

    if (baseNode?.id) {
      const { data: edges } = await supabase
        .from("intent_edges")
        .select("target_node_id, weight")
        .eq("source_node_id", baseNode.id)
        .limit(20);

      const targetIds = (edges ?? [])
        .map((edge) => String(edge.target_node_id ?? ""))
        .filter(Boolean);
      if (targetIds.length) {
        const { data: relatedNodes } = await supabase
          .from("intent_nodes")
          .select("id, keyword")
          .in("id", targetIds)
          .limit(20);

        (relatedNodes ?? []).forEach((node) => {
          const weight = Number(
            (edges ?? []).find(
              (edge) => String(edge.target_node_id) === String(node.id),
            )?.weight ?? 0.6,
          );
          expansions.set(
            String(node.keyword),
            Math.max(
              expansions.get(String(node.keyword)) ?? 0,
              Math.min(1, weight + 0.2),
            ),
          );
        });
      }
    }

    const { data: candidates } = await supabase
      .from("intent_nodes")
      .select("keyword")
      .limit(200);

    (candidates ?? []).forEach((candidate) => {
      const candidateKeyword = String(candidate.keyword ?? "").trim();
      if (!candidateKeyword) return;
      const similarity = trigramSimilarity(keyword, candidateKeyword);
      if (similarity >= 0.35) {
        expansions.set(
          candidateKeyword,
          Math.max(
            expansions.get(candidateKeyword) ?? 0,
            Number(similarity.toFixed(2)),
          ),
        );
      }
    });

    const { data: categories } = await supabase
      .from("categories")
      .select("name, slug")
      .limit(300);
    const keywordLower = keyword.toLowerCase();
    (categories ?? []).forEach((category) => {
      const name = String(category.name ?? "").toLowerCase();
      const slug = String(category.slug ?? "").toLowerCase();
      const similarity = Math.max(
        trigramSimilarity(keywordLower, name),
        trigramSimilarity(keywordLower, slug),
      );
      if (similarity >= 0.3) {
        expansions.set(
          String(category.slug ?? category.name),
          Math.max(
            expansions.get(String(category.slug ?? category.name)) ?? 0,
            Number((similarity * 0.9).toFixed(2)),
          ),
        );
      }
    });

    const expanded = Array.from(expansions.entries())
      .map(([k, confidence]) => ({
        keyword: k,
        confidence: Number(confidence.toFixed(2)),
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20);

    return NextResponse.json({ expanded });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to expand intent",
      },
      { status: 500 },
    );
  }
}
