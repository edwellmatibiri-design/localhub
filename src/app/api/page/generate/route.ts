import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { generatePage, type IntentNode } from "@/lib/page/generator";

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

  const intentId = String(body?.intentId ?? "").trim();
  if (!intentId) {
    return NextResponse.json(
      { error: "intentId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: intentNode, error: intentError } = await supabase
      .from("intent_nodes")
      .select("id, keyword, intent, micro_intent, landing_path, score")
      .eq("id", intentId)
      .maybeSingle();

    if (intentError) {
      return NextResponse.json({ error: intentError.message }, { status: 500 });
    }

    if (!intentNode) {
      return NextResponse.json(
        { error: "Intent node not found" },
        { status: 404 },
      );
    }

    const { data: related, error: relatedError } = await supabase
      .from("intent_nodes")
      .select("landing_path")
      .eq("intent", intentNode.intent)
      .neq("id", intentId)
      .order("score", { ascending: false })
      .limit(8);

    if (relatedError) {
      return NextResponse.json(
        { error: relatedError.message },
        { status: 500 },
      );
    }

    const relatedIntentUrls = (related ?? [])
      .map((item) => String(item.landing_path ?? "").trim())
      .filter(Boolean);

    const generated = await generatePage({
      ...(intentNode as IntentNode),
      relatedIntentUrls,
    });

    return NextResponse.json({
      intentId,
      title: generated.title,
      metaDescription: generated.metaDescription,
      h1: generated.h1,
      h2: generated.h2,
      h3: generated.h3,
      faqs: generated.faqs,
      schema: generated.schema,
      internalLinks: generated.internalLinks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate page",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
