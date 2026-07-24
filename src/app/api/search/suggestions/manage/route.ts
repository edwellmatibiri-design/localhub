import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type SuggestionType = "category" | "location" | "vendor" | "listing" | "intent";

type Body = {
  id?: number | string;
  keyword?: string;
  type?: SuggestionType;
  scoreDelta?: number;
};

const VALID_TYPES: SuggestionType[] = [
  "category",
  "location",
  "vendor",
  "listing",
  "intent",
];

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

  const keyword = String(body.keyword ?? "")
    .trim()
    .toLowerCase();
  const type = String(body.type ?? "").trim() as SuggestionType;
  const scoreDelta = Number(body.scoreDelta ?? 1);

  if (!keyword || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { ok: false, error: "keyword and valid type are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("search_suggestions")
      .select("id, score")
      .eq("keyword", keyword)
      .eq("type", type)
      .maybeSingle();

    if (!existing) {
      const { data: inserted, error } = await supabase
        .from("search_suggestions")
        .insert({ keyword, type, score: Math.max(0, scoreDelta) })
        .select("id")
        .single();
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true, id: inserted.id });
    }

    const { error } = await supabase
      .from("search_suggestions")
      .update({
        score: Math.max(0, Number(existing.score ?? 0) + scoreDelta),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    return NextResponse.json({ ok: true, id: existing.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to manage suggestion",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const id = Number(body.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json(
      { ok: false, error: "id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("search_suggestions")
      .delete()
      .eq("id", id);
    if (error)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete suggestion",
      },
      { status: 500 },
    );
  }
}
