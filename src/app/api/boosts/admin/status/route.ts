import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  boostId?: number | string;
  action?: "force_activate" | "force_expire";
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

  const boostId = Number(body.boostId);
  const action = String(body.action ?? "").trim();

  if (
    !Number.isFinite(boostId) ||
    boostId <= 0 ||
    (action !== "force_activate" && action !== "force_expire")
  ) {
    return NextResponse.json(
      { ok: false, error: "boostId and valid action are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    if (action === "force_activate") {
      const { data: boost, error: readError } = await supabase
        .from("boosts")
        .select("start_date, end_date")
        .eq("id", boostId)
        .maybeSingle();
      if (readError) {
        return NextResponse.json(
          { ok: false, error: readError.message },
          { status: 500 },
        );
      }

      const startMs = Date.parse(String(boost?.start_date ?? ""));
      const endMs = Date.parse(String(boost?.end_date ?? ""));
      const duration =
        Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
          ? endMs - startMs
          : 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const { error } = await supabase
        .from("boosts")
        .update({
          status: "active",
          start_date: new Date(now).toISOString(),
          end_date: new Date(now + duration).toISOString(),
        })
        .eq("id", boostId);

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase
      .from("boosts")
      .update({
        status: "expired",
        end_date: new Date().toISOString(),
      })
      .eq("id", boostId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update boost",
      },
      { status: 500 },
    );
  }
}
