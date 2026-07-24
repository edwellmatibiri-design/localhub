import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  userId?: string;
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
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "userId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const [{ data: loyalty }, { data: transactions }] = await Promise.all([
      supabase
        .from("loyalty_points")
        .select("points, lifetime_points, tier, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("points_transactions")
        .select("id, points, type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      ok: true,
      points: Number(loyalty?.points ?? 0),
      lifetime_points: Number(loyalty?.lifetime_points ?? 0),
      tier: String(loyalty?.tier ?? "bronze"),
      recentTransactions: (transactions ?? []).map((row) => ({
        id: Number(row.id),
        points: Number(row.points),
        type: String(row.type),
        created_at: String(row.created_at),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load loyalty points",
      },
      { status: 500 },
    );
  }
}
