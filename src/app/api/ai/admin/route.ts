import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  action?: "reset_session";
  sessionId?: number | string;
};

function safeRatio(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const url = new URL(request.url);
    const sessionId = Number(url.searchParams.get("sessionId") ?? 0);

    if (Number.isFinite(sessionId) && sessionId > 0) {
      const [{ data: session }, { data: logs }] = await Promise.all([
        supabase
          .from("ai_sessions")
          .select(
            "id, user_id, vendor_id, role, context, created_at, updated_at",
          )
          .eq("id", sessionId)
          .maybeSingle(),
        supabase
          .from("ai_messages")
          .select("id, session_id, sender, message, created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true }),
      ]);

      return NextResponse.json({ ok: true, session, logs: logs ?? [] });
    }

    const [{ data: sessions }, { data: userUsage }, { data: behaviourRows }] =
      await Promise.all([
        supabase
          .from("ai_sessions")
          .select(
            "id, role, user_id, vendor_id, context, created_at, updated_at",
          )
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("ai_sessions").select("role, user_id, vendor_id"),
        supabase
          .from("user_behaviour")
          .select("user_id, leads_requested, bookings_completed"),
      ]);

    const totalSessions = Number(sessions?.length ?? 0);
    const roleUsage = (userUsage ?? []).reduce(
      (acc, row) => {
        const role = String(row.role ?? "user");
        if (role === "vendor") acc.vendor += 1;
        else acc.user += 1;
        return acc;
      },
      { user: 0, vendor: 0 },
    );

    const topIntentMap = new Map<string, number>();
    (sessions ?? []).forEach((session) => {
      const intent = String(
        (session.context as { lastIntent?: unknown } | null)?.lastIntent ??
          "general_question",
      );
      topIntentMap.set(intent, (topIntentMap.get(intent) ?? 0) + 1);
    });

    const topIntents = Array.from(topIntentMap.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const aiUserSet = new Set(
      (userUsage ?? [])
        .filter((row) => String(row.role ?? "") === "user")
        .map((row) => String(row.user_id ?? ""))
        .filter(Boolean),
    );

    let aiLeads = 0;
    let aiBookings = 0;
    let nonAiLeads = 0;
    let nonAiBookings = 0;
    let aiUsers = 0;
    let nonAiUsers = 0;

    (behaviourRows ?? []).forEach((row) => {
      const userId = String(row.user_id ?? "");
      const leads = Number(row.leads_requested ?? 0);
      const bookings = Number(row.bookings_completed ?? 0);
      if (aiUserSet.has(userId)) {
        aiUsers += 1;
        aiLeads += leads;
        aiBookings += bookings;
      } else {
        nonAiUsers += 1;
        nonAiLeads += leads;
        nonAiBookings += bookings;
      }
    });

    const aiConversion = safeRatio(aiBookings, aiLeads);
    const baselineConversion = safeRatio(nonAiBookings, nonAiLeads);
    const conversionUplift = aiConversion - baselineConversion;

    const aiBookingsPerUser = safeRatio(aiBookings, aiUsers);
    const baselineBookingsPerUser = safeRatio(nonAiBookings, nonAiUsers);
    const bookingUplift = aiBookingsPerUser - baselineBookingsPerUser;

    return NextResponse.json({
      ok: true,
      metrics: {
        totalSessions,
        userUsage: roleUsage.user,
        vendorUsage: roleUsage.vendor,
        topIntents,
        conversionUplift,
        bookingUplift,
      },
      sessions: sessions ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load AI analytics",
      },
      { status: 500 },
    );
  }
}

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

  const action = body.action;
  const sessionId = Number(body.sessionId ?? 0);

  if (
    action !== "reset_session" ||
    !Number.isFinite(sessionId) ||
    sessionId <= 0
  ) {
    return NextResponse.json(
      { ok: false, error: "Valid action and sessionId are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { error: deleteError } = await supabase
      .from("ai_messages")
      .delete()
      .eq("session_id", sessionId);
    if (deleteError) {
      return NextResponse.json(
        { ok: false, error: deleteError.message },
        { status: 500 },
      );
    }

    const { error: updateError } = await supabase
      .from("ai_sessions")
      .update({ context: {} })
      .eq("id", sessionId);
    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to reset session",
      },
      { status: 500 },
    );
  }
}
