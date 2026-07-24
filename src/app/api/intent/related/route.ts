import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  intentId?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const intentId = String(body.intentId ?? "").trim();
  if (!intentId) {
    return NextResponse.json(
      { error: "intentId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: edges, error: edgesError } = await supabase
      .from("intent_edges")
      .select("id, source_node_id, target_node_id, relation, weight")
      .eq("source_node_id", intentId);

    if (edgesError) {
      return NextResponse.json({ error: edgesError.message }, { status: 500 });
    }

    const targetIds = Array.from(
      new Set(
        (edges ?? [])
          .map((edge) => String(edge.target_node_id ?? ""))
          .filter(Boolean),
      ),
    );

    if (!targetIds.length) {
      return NextResponse.json({ intentId, relatedIntents: [] });
    }

    const { data: targetIntents, error: targetError } = await supabase
      .from("intent_nodes")
      .select("id, keyword, intent, micro_intent, landing_path, score")
      .in("id", targetIds);

    if (targetError) {
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }

    const edgeByTarget = new Map<
      string,
      { relation: string; weight: number }
    >();
    (edges ?? []).forEach((edge) => {
      const key = String(edge.target_node_id ?? "");
      if (!key) return;
      edgeByTarget.set(key, {
        relation: String(edge.relation ?? "related"),
        weight: Number(edge.weight ?? 0),
      });
    });

    const relatedIntents = (targetIntents ?? []).map((node) => ({
      ...node,
      edge: edgeByTarget.get(String(node.id ?? "")) ?? {
        relation: "related",
        weight: 0,
      },
    }));

    return NextResponse.json({ intentId, relatedIntents });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch related intents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
