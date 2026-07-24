import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { predictUserIntent } from "@/lib/ai/intentPredictor";

type Body = {
  userId?: string;
  recentSearches?: string[];
  recentMessages?: string[];
  categoryClicks?: string[];
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

  const userId = String(body.userId ?? "").trim();

  try {
    const supabase = createServiceClient();

    let recentSearches = Array.isArray(body.recentSearches)
      ? body.recentSearches.map((item) => String(item))
      : [];
    let recentMessages = Array.isArray(body.recentMessages)
      ? body.recentMessages.map((item) => String(item))
      : [];
    let categoryClicks = Array.isArray(body.categoryClicks)
      ? body.categoryClicks.map((item) => String(item))
      : [];

    if (userId) {
      const [{ data: behaviour }, { data: aiMessages }, { data: leads }] =
        await Promise.all([
          supabase
            .from("user_behaviour")
            .select("searches")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("ai_messages")
            .select("message, sender, created_at, session_id")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("leads")
            .select("message, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(30),
        ]);

      if (recentSearches.length === 0) {
        const syntheticSearches = Number(behaviour?.searches ?? 0);
        recentSearches = Array.from(
          { length: Math.min(syntheticSearches, 8) },
          () => "search_category",
        );
      }

      if (recentMessages.length === 0) {
        recentMessages = (aiMessages ?? [])
          .filter((row) => String(row.sender ?? "") !== "ai")
          .map((row) => String(row.message ?? ""))
          .slice(0, 10);
      }

      if (categoryClicks.length === 0) {
        categoryClicks = (leads ?? [])
          .map((row) => String(row.message ?? ""))
          .filter(Boolean)
          .slice(0, 12);
      }
    }

    const prediction = predictUserIntent({
      recentSearches,
      recentMessages,
      categoryClicks,
    });

    return NextResponse.json({ ok: true, ...prediction });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to predict user intent",
      },
      { status: 500 },
    );
  }
}
