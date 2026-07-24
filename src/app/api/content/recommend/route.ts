import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  intentId?: number | string;
  category?: string;
  location?: string;
};

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const intentId = Number(body.intentId);
  const category = normalize(body.category);
  const location = normalize(body.location);

  try {
    const supabase = createServiceClient();

    let query = supabase
      .from("content_guides")
      .select("id, title, slug, summary, category, location, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (Number.isFinite(intentId) && intentId > 0) {
      query = query.eq("intent_id", intentId);
    } else if (category) {
      query = query.eq("category", category);
    }

    const { data: relatedGuides } = await query;

    const similarFilter = [
      category ? `category.eq.${category}` : "",
      location ? `location.eq.${location}` : "",
    ]
      .filter(Boolean)
      .join(",");

    let similarQuery = supabase
      .from("content_guides")
      .select("id, title, slug, summary, category, location, updated_at")
      .order("updated_at", { ascending: false })
      .limit(12);

    if (similarFilter) {
      similarQuery = similarQuery.or(similarFilter);
    }

    const { data: similarTopics } = await similarQuery;

    const { data: trendingGuides } = await supabase
      .from("content_guides")
      .select("id, title, slug, summary, category, location, updated_at")
      .order("updated_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      relatedGuides: relatedGuides ?? [],
      similarTopics: similarTopics ?? [],
      trendingGuides: trendingGuides ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to recommend guides",
      },
      { status: 500 },
    );
  }
}
