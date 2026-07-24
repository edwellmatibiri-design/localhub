import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { runSearchModule } from "@/lib/ai/modules/search";
import { runBookingModule } from "@/lib/ai/modules/booking";
import { runVendorModule } from "@/lib/ai/modules/vendor";
import { runQuoteModule } from "@/lib/ai/modules/quote";
import { runDisputeModule } from "@/lib/ai/modules/dispute";
import { runGeneralModule } from "@/lib/ai/modules/general";
import { predictUserIntent } from "@/lib/ai/intentPredictor";

type Intent =
  | "search_help"
  | "booking_help"
  | "vendor_help"
  | "quote_help"
  | "dispute_help"
  | "general_question";
type Role = "user" | "vendor";

type Body = {
  sessionId?: number | string | null;
  message?: string;
  role?: Role;
  userId?: string;
  vendorId?: string;
};

function detectIntent(message: string): Intent {
  const text = message.toLowerCase();

  if (
    /outreach|onboard vendor|vendor onboarding|recruit vendor|vendor acquisition/i.test(
      text,
    )
  )
    return "vendor_help";
  if (/search|find|best option|recommend|category|vendor near/i.test(text))
    return "search_help";
  if (/book|booking|schedule|date|time|cancel|cancellation/i.test(text))
    return "booking_help";
  if (/lead|follow up|response rate|profile|crm|negotiat/i.test(text))
    return "vendor_help";
  if (/quote|pricing|price|estimate|cost|compare/i.test(text))
    return "quote_help";
  if (/dispute|refund|complaint|issue|evidence|resolution/i.test(text))
    return "dispute_help";
  return "general_question";
}

function smartSuggestions(role: Role, intent: Intent) {
  if (role === "vendor") {
    const vendorSuggestions = [
      "Would you like me to follow up?",
      "Would you like me to write a quote?",
      "Would you like me to respond to this lead?",
    ];
    if (intent === "quote_help")
      return [
        "Would you like me to write a quote?",
        "Would you like me to follow up?",
        "Would you like me to respond to this lead?",
      ];
    return vendorSuggestions;
  }

  const userSuggestions = [
    "Would you like me to book this for you?",
    "Would you like me to compare vendors?",
    "Would you like me to explain pricing?",
    "Would you like to start Smart Booking Flow v2?",
  ];

  if (intent === "booking_help")
    return [
      "Would you like me to book this for you?",
      "Would you like me to explain pricing?",
      "Would you like me to compare vendors?",
    ];
  if (intent === "search_help")
    return [
      "Would you like me to compare vendors?",
      "Would you like me to explain pricing?",
      "Would you like me to book this for you?",
    ];
  return userSuggestions;
}

function getModule(intent: Intent) {
  switch (intent) {
    case "search_help":
      return runSearchModule;
    case "booking_help":
      return runBookingModule;
    case "vendor_help":
      return runVendorModule;
    case "quote_help":
      return runQuoteModule;
    case "dispute_help":
      return runDisputeModule;
    default:
      return runGeneralModule;
  }
}

function mapPredictedIntentToAssistantIntent(predictedIntent: string): Intent {
  if (predictedIntent === "ready_to_book") return "booking_help";
  if (predictedIntent === "comparing_vendors") return "search_help";
  if (predictedIntent === "price_sensitive") return "quote_help";
  if (predictedIntent === "needs_help") return "booking_help";
  return "general_question";
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

  const message = String(body.message ?? "").trim();
  const incomingSessionId = Number(body.sessionId ?? 0);
  const role: Role = body.role === "vendor" ? "vendor" : "user";
  const userId = String(body.userId ?? "").trim() || null;
  const vendorId = String(body.vendorId ?? "").trim() || null;

  if (!message) {
    return NextResponse.json(
      { ok: false, error: "message is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    let sessionId = incomingSessionId;
    let sessionContext: Record<string, unknown> = {};

    if (Number.isFinite(sessionId) && sessionId > 0) {
      const { data: existingSession, error: sessionError } = await supabase
        .from("ai_sessions")
        .select("id, role, user_id, vendor_id, context")
        .eq("id", sessionId)
        .maybeSingle();

      if (sessionError) {
        return NextResponse.json(
          { ok: false, error: sessionError.message },
          { status: 500 },
        );
      }

      if (!existingSession) {
        return NextResponse.json(
          { ok: false, error: "Session not found" },
          { status: 404 },
        );
      }

      sessionContext = (existingSession.context ?? {}) as Record<
        string,
        unknown
      >;
    } else {
      const { data: insertedSession, error: insertSessionError } =
        await supabase
          .from("ai_sessions")
          .insert({ role, user_id: userId, vendor_id: vendorId, context: {} })
          .select("id")
          .single();

      if (insertSessionError) {
        return NextResponse.json(
          { ok: false, error: insertSessionError.message },
          { status: 500 },
        );
      }

      sessionId = Number(insertedSession.id);
    }

    const sender = role === "vendor" ? "vendor" : "user";

    const { error: userMessageError } = await supabase
      .from("ai_messages")
      .insert({
        session_id: sessionId,
        sender,
        message,
      });

    if (userMessageError) {
      return NextResponse.json(
        { ok: false, error: userMessageError.message },
        { status: 500 },
      );
    }

    let predictedIntent: { intent: string; confidence: number } | null = null;
    if (userId) {
      const [{ data: behaviour }, { data: userMessages }, { data: leads }] =
        await Promise.all([
          supabase
            .from("user_behaviour")
            .select("searches")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("ai_messages")
            .select("message, sender, created_at")
            .order("created_at", { ascending: false })
            .limit(40),
          supabase
            .from("leads")
            .select("message, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

      const recentSearches = Array.from(
        { length: Math.min(8, Number(behaviour?.searches ?? 0)) },
        () => "service search",
      );
      const recentMessages = (userMessages ?? [])
        .filter((row) => String(row.sender ?? "") !== "ai")
        .map((row) => String(row.message ?? ""))
        .slice(0, 10);
      const categoryClicks = (leads ?? [])
        .map((row) => String(row.message ?? ""))
        .filter(Boolean)
        .slice(0, 12);

      predictedIntent = predictUserIntent({
        recentSearches,
        recentMessages,
        categoryClicks,
      });
    }

    const detectedIntent = detectIntent(message);
    const intent =
      detectedIntent === "general_question" && predictedIntent
        ? mapPredictedIntentToAssistantIntent(predictedIntent.intent)
        : detectedIntent;
    const module = getModule(intent);

    const { reply, updatedContext } = await module({
      message,
      context: sessionContext,
      userId: userId ?? undefined,
      vendorId: vendorId ?? undefined,
    });

    const nextContext: Record<string, unknown> = {
      ...updatedContext,
      lastIntent: intent,
      lastMessageAt: new Date().toISOString(),
      predictedUserIntent: predictedIntent,
    };

    const { error: sessionUpdateError } = await supabase
      .from("ai_sessions")
      .update({ context: nextContext })
      .eq("id", sessionId);

    if (sessionUpdateError) {
      return NextResponse.json(
        { ok: false, error: sessionUpdateError.message },
        { status: 500 },
      );
    }

    const { error: aiMessageError } = await supabase
      .from("ai_messages")
      .insert({
        session_id: sessionId,
        sender: "ai",
        message: reply,
      });

    if (aiMessageError) {
      return NextResponse.json(
        { ok: false, error: aiMessageError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      intent,
      reply,
      updatedContext: nextContext,
      suggestions: smartSuggestions(role, intent),
      predictedUserIntent: predictedIntent,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to route AI request",
      },
      { status: 500 },
    );
  }
}
