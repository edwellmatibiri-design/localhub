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

    const { data: intent, error: intentError } = await supabase
      .from("intent_nodes")
      .select(
        "id, keyword, intent, micro_intent, landing_path, score, created_at, updated_at",
      )
      .eq("id", intentId)
      .maybeSingle();

    if (intentError) {
      return NextResponse.json({ error: intentError.message }, { status: 500 });
    }

    if (!intent) {
      return NextResponse.json(
        { error: "Intent node not found" },
        { status: 404 },
      );
    }

    const { data: sourceEdges, error: sourceEdgesError } = await supabase
      .from("intent_edges")
      .select(
        "id, source_node_id, target_node_id, relation, weight, created_at, updated_at",
      )
      .eq("source_node_id", intentId);

    if (sourceEdgesError) {
      return NextResponse.json(
        { error: sourceEdgesError.message },
        { status: 500 },
      );
    }

    const { data: targetEdges, error: targetEdgesError } = await supabase
      .from("intent_edges")
      .select(
        "id, source_node_id, target_node_id, relation, weight, created_at, updated_at",
      )
      .eq("target_node_id", intentId);

    if (targetEdgesError) {
      return NextResponse.json(
        { error: targetEdgesError.message },
        { status: 500 },
      );
    }

    const edges = [...(sourceEdges ?? []), ...(targetEdges ?? [])];

    return NextResponse.json({ intent, edges });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch intent graph node",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
