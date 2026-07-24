import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { buildGuide, slugify } from "@/lib/content/guideBuilder";

type Body = {
  guideId?: number | string;
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

  const guideId = Number(body.guideId);
  if (!Number.isFinite(guideId) || guideId <= 0) {
    return NextResponse.json(
      { ok: false, error: "guideId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: existing, error: readError } = await supabase
      .from("content_guides")
      .select("id, intent_id, category, location, title")
      .eq("id", guideId)
      .maybeSingle();

    if (readError) {
      return NextResponse.json(
        { ok: false, error: readError.message },
        { status: 500 },
      );
    }
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Guide not found" },
        { status: 404 },
      );
    }

    const guide = buildGuide({
      intentId: Number(existing.intent_id ?? 0) || null,
      category: String(existing.category ?? "") || null,
      location: String(existing.location ?? "") || null,
      seedTitle: String(existing.title ?? "") || null,
    });

    const nextSlug = slugify(guide.title) || `guide-${guideId}`;
    const { error: updateError } = await supabase
      .from("content_guides")
      .update({
        title: guide.title,
        slug: nextSlug,
        summary: guide.summary,
        content: guide.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guideId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, guideId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to regenerate guide",
      },
      { status: 500 },
    );
  }
}
