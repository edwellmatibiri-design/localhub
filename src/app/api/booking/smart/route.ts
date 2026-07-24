import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { buildAutoScope } from "@/lib/booking/autoScope";
import { buildInstantQuote } from "@/lib/booking/instantQuote";
import { generateBookingSummary } from "@/lib/booking/summary";
import { getQuestionSet } from "@/lib/booking/questionsEngine";

type Body = {
  userId?: string;
  category?: string;
  location?: string;
  intentId?: number | string;
  preferredDate?: string;
  answers?: Record<string, unknown>;
  photos?: string[];
  userNotes?: string;
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
  const category = String(body.category ?? "")
    .trim()
    .toLowerCase();
  const location = String(body.location ?? "").trim();
  const answers = body.answers ?? {};
  const photos = Array.isArray(body.photos)
    ? body.photos.map((item) => String(item)).filter(Boolean)
    : [];
  const userNotes = String(body.userNotes ?? "").trim();
  const intentId = Number(body.intentId);
  const preferredDate = String(
    body.preferredDate ?? new Date().toISOString(),
  ).trim();

  if (!userId || !category || !location) {
    return NextResponse.json(
      { ok: false, error: "userId, category, and location are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const [{ data: scopingConfigRow }, { data: pricingConfigRow }] =
      await Promise.all([
        supabase
          .from("booking_engine_settings")
          .select("value")
          .eq("key", "scoping_logic")
          .maybeSingle(),
        supabase
          .from("booking_engine_settings")
          .select("value")
          .eq("key", "pricing_logic")
          .maybeSingle(),
      ]);

    const scope = buildAutoScope({
      category,
      answers,
      config: (scopingConfigRow?.value ?? {}) as Record<string, unknown>,
    });

    const quote = buildInstantQuote({
      job_size: scope.job_size,
      job_complexity: scope.job_complexity,
      estimated_duration: scope.estimated_duration,
      config: (pricingConfigRow?.value ?? {}) as Record<string, unknown>,
    });

    const summary = generateBookingSummary({
      category,
      answers,
      scope,
      quote,
      photos,
      userNotes,
    });

    const leadMessage = `${summary.job_description}\nInstant Quote: R ${quote.price_range_min} - R ${quote.price_range_max}`;

    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const routeResponse = await fetch(`${origin}/api/leads/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        intentId:
          Number.isFinite(intentId) && intentId > 0 ? intentId : undefined,
        category,
        location,
        message: leadMessage,
        smartBooking: {
          summary,
          scope,
          quote,
          photos,
          userNotes,
          preferredDate,
        },
      }),
    });

    const routePayload = await routeResponse.json();
    if (!routeResponse.ok || !routePayload?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: String(routePayload?.error ?? "Lead routing failed"),
        },
        { status: 500 },
      );
    }

    const leadIds = Array.isArray(routePayload?.leadIds)
      ? routePayload.leadIds
      : [];

    const { data: scopeRow, error: scopeError } = await supabase
      .from("booking_scopes")
      .insert({
        user_id: userId,
        category,
        answers,
        photos,
        user_notes: userNotes || null,
        job_summary: summary.job_description,
        job_size: scope.job_size,
        job_complexity: scope.job_complexity,
        estimated_duration: scope.estimated_duration,
        estimated_team_size: scope.estimated_team_size,
        instant_quote_min: quote.price_range_min,
        instant_quote_max: quote.price_range_max,
        lead_ids: leadIds,
      })
      .select("id")
      .single();

    if (scopeError) {
      return NextResponse.json(
        { ok: false, error: scopeError.message },
        { status: 500 },
      );
    }

    const { data: questionRows } = await supabase
      .from("booking_questions")
      .select("id, order_index")
      .eq("category", category)
      .order("order_index", { ascending: true });

    const defaultQuestions = getQuestionSet(category);
    const questionIdByKey = new Map<string, number>();
    (questionRows ?? []).forEach((row, index) => {
      const key = defaultQuestions[index]?.key;
      if (!key) return;
      questionIdByKey.set(key, Number(row.id));
    });

    const answerInserts = Object.entries(answers)
      .map(([key, value]) => {
        const questionId = questionIdByKey.get(key) ?? 0;
        if (!Number.isFinite(questionId) || questionId <= 0) return null;
        return {
          booking_id: Number(scopeRow.id),
          question_id: questionId,
          answer: Array.isArray(value)
            ? JSON.stringify(value)
            : String(value ?? ""),
        };
      })
      .filter(
        (
          item,
        ): item is {
          booking_id: number;
          question_id: number;
          answer: string;
        } => Boolean(item),
      );

    if (answerInserts.length > 0) {
      await supabase.from("booking_answers").insert(answerInserts);
    }

    return NextResponse.json({
      ok: true,
      bookingScopeId: scopeRow.id,
      vendorsSent: routePayload.vendorsSent,
      summary,
      scope,
      quote,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit smart booking",
      },
      { status: 500 },
    );
  }
}
