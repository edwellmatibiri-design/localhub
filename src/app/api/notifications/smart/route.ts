import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { buildSmartNotifications } from "@/lib/ai/smartNotifications";

type Body = {
  userId?: string;
};

function hoursSince(dateIso: string) {
  const ms = Date.now() - Date.parse(dateIso);
  return Math.max(0, ms / (1000 * 60 * 60));
}

function minutesSince(dateIso: string) {
  const ms = Date.now() - Date.parse(dateIso);
  return Math.max(0, ms / (1000 * 60));
}

async function computeAndPersistNotifications(userId: string) {
  const supabase = createServiceClient();

  const [
    { data: leads },
    { data: quotes },
    { data: bookings },
    { data: aiMessages },
    { data: behaviour },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, created_at, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("quotes")
      .select("id, created_at, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("bookings")
      .select("id, preferred_date, status")
      .eq("user_id", userId)
      .order("preferred_date", { ascending: true })
      .limit(20),
    supabase
      .from("ai_messages")
      .select("message, sender, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("user_behaviour")
      .select("searches")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const latestPendingLead = (leads ?? []).find(
    (lead) => String(lead.status ?? "") === "sent",
  );
  const latestPendingQuote = (quotes ?? []).find(
    (quote) => String(quote.status ?? "") === "new",
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowToken = tomorrow.toISOString().slice(0, 10);
  const bookingTomorrow = (bookings ?? []).some(
    (booking) =>
      String(booking.preferred_date ?? "").slice(0, 10) === tomorrowToken,
  );

  const leadWaitMinutes = latestPendingLead?.created_at
    ? minutesSince(String(latestPendingLead.created_at))
    : 0;
  const quoteAgeHours = latestPendingQuote?.created_at
    ? hoursSince(String(latestPendingQuote.created_at))
    : 0;

  const recentMessages = (aiMessages ?? [])
    .filter((row) => String(row.sender ?? "") !== "ai")
    .map((row) => String(row.message ?? ""))
    .slice(0, 8);

  const recentSearches = Array.from(
    { length: Math.min(6, Number(behaviour?.searches ?? 0)) },
    () => "service search",
  );

  const computed = buildSmartNotifications({
    leadWaitMinutes,
    quoteAgeHours,
    bookingTomorrow,
    recentSearches,
    recentMessages,
    categoryClicks: recentSearches,
  });

  if (computed.notifications.length > 0) {
    await supabase.from("notifications").insert(
      computed.notifications.map((item) => ({
        user_id: userId,
        vendor_id: null,
        type: item.type,
        message: item.message,
      })),
    );
  }

  return computed;
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

  const userId = String(body.userId ?? "").trim();
  if (!userId)
    return NextResponse.json(
      { ok: false, error: "userId is required" },
      { status: 400 },
    );

  try {
    const computed = await computeAndPersistNotifications(userId);
    return NextResponse.json({
      ok: true,
      notifications: computed.notifications,
      intent: computed.predictedIntent,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to compute smart notifications",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = String(url.searchParams.get("userId") ?? "").trim();
    if (!userId)
      return NextResponse.json(
        { ok: false, error: "userId is required" },
        { status: 400 },
      );

    const computed = await computeAndPersistNotifications(userId);
    return NextResponse.json({
      ok: true,
      notifications: computed.notifications,
      intent: computed.predictedIntent,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load smart notifications",
      },
      { status: 500 },
    );
  }
}
