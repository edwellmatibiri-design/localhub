import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { buildGuide, slugify } from "@/lib/content/guideBuilder";

type Body = {
  intentId?: number | string;
  category?: string;
  location?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const intentIdNumber = Number(body.intentId);
  const intentId =
    Number.isFinite(intentIdNumber) && intentIdNumber > 0
      ? intentIdNumber
      : null;
  const category = String(body.category ?? "").trim() || null;
  const location = String(body.location ?? "").trim() || null;

  if (!intentId && !category && !location) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide at least one of intentId, category, location",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const guide = buildGuide({ intentId, category, location });

    const timestamp = Date.now();
    let slug = slugify(guide.title);
    if (!slug) {
      slug = `${guide.slugBase}-${timestamp}`;
    }

    const { data: existing } = await supabase
      .from("content_guides")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      slug = `${slug}-${timestamp}`;
    }

    const { data, error } = await supabase
      .from("content_guides")
      .insert({
        intent_id: intentId,
        category,
        location,
        title: guide.title,
        slug,
        summary: guide.summary,
        content: guide.content,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, guideId: data.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to generate guide",
      },
      { status: 500 },
    );
  }
}
