import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  adId?: number | string;
  action?:
    | "pause"
    | "resume"
    | "edit_budget"
    | "extend_duration"
    | "adjust_bid"
    | "adjust_daily_budget"
    | "force_pause"
    | "force_resume";
  bidAmount?: number;
  dailyBudget?: number;
  extraDays?: number;
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

  const adId = Number(body.adId);
  const action = String(body.action ?? "").trim();
  if (!Number.isFinite(adId) || adId <= 0 || !action) {
    return NextResponse.json(
      { ok: false, error: "adId and action are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    if (action === "pause" || action === "force_pause") {
      const { error } = await supabase
        .from("ads")
        .update({ status: "paused" })
        .eq("id", adId);
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "resume" || action === "force_resume") {
      const { error } = await supabase
        .from("ads")
        .update({ status: "active" })
        .eq("id", adId);
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "edit_budget" || action === "adjust_daily_budget") {
      const dailyBudget = Number(body.dailyBudget);
      if (!Number.isFinite(dailyBudget) || dailyBudget <= 0) {
        return NextResponse.json(
          { ok: false, error: "dailyBudget must be > 0" },
          { status: 400 },
        );
      }
      const { error } = await supabase
        .from("ads")
        .update({ daily_budget: Math.round(dailyBudget) })
        .eq("id", adId);
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "adjust_bid") {
      const bidAmount = Number(body.bidAmount);
      if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
        return NextResponse.json(
          { ok: false, error: "bidAmount must be > 0" },
          { status: 400 },
        );
      }
      const { error } = await supabase
        .from("ads")
        .update({ bid_amount: Math.round(bidAmount) })
        .eq("id", adId);
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "extend_duration") {
      const extraDays = Number(body.extraDays);
      if (!Number.isFinite(extraDays) || extraDays <= 0) {
        return NextResponse.json(
          { ok: false, error: "extraDays must be > 0" },
          { status: 400 },
        );
      }

      const { data: ad } = await supabase
        .from("ads")
        .select("end_date")
        .eq("id", adId)
        .maybeSingle();
      const base = Date.parse(String(ad?.end_date ?? ""));
      const nextEnd = new Date(
        (Number.isFinite(base) ? base : Date.now()) +
          extraDays * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { error } = await supabase
        .from("ads")
        .update({ end_date: nextEnd })
        .eq("id", adId);
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported action" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to manage ad",
      },
      { status: 500 },
    );
  }
}
