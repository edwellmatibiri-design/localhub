import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  action?:
    | "reorder_question"
    | "add_question"
    | "remove_question"
    | "adjust_scoping_logic"
    | "adjust_pricing_logic";
  questionId?: number | string;
  category?: string;
  question?: string;
  type?: "text" | "number" | "choice" | "photo";
  choices?: string[];
  required?: boolean;
  orderIndex?: number;
  config?: Record<string, unknown>;
};

export async function GET() {
  try {
    const supabase = createServiceClient();

    const [
      { data: questions },
      { data: answers },
      { data: scopes },
      { data: scopingLogic },
      { data: pricingLogic },
    ] = await Promise.all([
      supabase
        .from("booking_questions")
        .select(
          "id, category, question, type, choices, required, order_index, created_at",
        )
        .order("category", { ascending: true })
        .order("order_index", { ascending: true }),
      supabase
        .from("booking_answers")
        .select("id, booking_id, question_id, answer, created_at")
        .limit(10000),
      supabase
        .from("booking_scopes")
        .select(
          "id, category, estimated_duration, instant_quote_min, instant_quote_max, lead_ids, created_at",
        )
        .limit(5000),
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

    const answerCountByQuestion = new Map<number, number>();
    (answers ?? []).forEach((row) => {
      const questionId = Number(row.question_id ?? 0);
      if (!Number.isFinite(questionId) || questionId <= 0) return;
      answerCountByQuestion.set(
        questionId,
        (answerCountByQuestion.get(questionId) ?? 0) + 1,
      );
    });

    const mostCommonQuestions = (questions ?? [])
      .map((question) => ({
        questionId: Number(question.id),
        category: String(question.category),
        question: String(question.question),
        answerCount: answerCountByQuestion.get(Number(question.id)) ?? 0,
      }))
      .sort((a, b) => b.answerCount - a.answerCount)
      .slice(0, 10);

    const dropoffPoints = (questions ?? [])
      .map((question) => ({
        questionId: Number(question.id),
        category: String(question.category),
        question: String(question.question),
        orderIndex: Number(question.order_index ?? 0),
        answerCount: answerCountByQuestion.get(Number(question.id)) ?? 0,
      }))
      .sort((a, b) => a.answerCount - b.answerCount)
      .slice(0, 10);

    const scopesByCategory = new Map<string, number>();
    (scopes ?? []).forEach((scope) => {
      const category = String(scope.category ?? "unknown");
      scopesByCategory.set(category, (scopesByCategory.get(category) ?? 0) + 1);
    });

    const categoryScopingPerformance = Array.from(
      scopesByCategory.entries(),
    ).map(([category, count]) => ({ category, totalScopedJobs: count }));

    const scopedCount = Number(scopes?.length ?? 0);
    const rangesWithSpread = (scopes ?? []).filter(
      (scope) =>
        Number(scope.instant_quote_max ?? 0) >
        Number(scope.instant_quote_min ?? 0),
    ).length;
    const instantQuoteAccuracy =
      scopedCount > 0 ? rangesWithSpread / scopedCount : 0;

    return NextResponse.json({
      ok: true,
      metrics: {
        mostCommonQuestions,
        dropoffPoints,
        instantQuoteAccuracy,
        categoryScopingPerformance,
      },
      questions: questions ?? [],
      scopingLogic: (scopingLogic?.value ?? {}) as Record<string, unknown>,
      pricingLogic: (pricingLogic?.value ?? {}) as Record<string, unknown>,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load booking intelligence",
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

  const action = String(body.action ?? "").trim();

  try {
    const supabase = createServiceClient();

    if (action === "reorder_question") {
      const questionId = Number(body.questionId);
      const orderIndex = Number(body.orderIndex);
      if (
        !Number.isFinite(questionId) ||
        questionId <= 0 ||
        !Number.isFinite(orderIndex)
      ) {
        return NextResponse.json(
          { ok: false, error: "questionId and orderIndex are required" },
          { status: 400 },
        );
      }

      const { error } = await supabase
        .from("booking_questions")
        .update({ order_index: orderIndex })
        .eq("id", questionId);
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "add_question") {
      const category = String(body.category ?? "")
        .trim()
        .toLowerCase();
      const question = String(body.question ?? "").trim();
      const type = body.type;
      if (!category || !question || !type) {
        return NextResponse.json(
          { ok: false, error: "category, question, and type are required" },
          { status: 400 },
        );
      }

      const { error } = await supabase.from("booking_questions").insert({
        category,
        question,
        type,
        choices: Array.isArray(body.choices) ? body.choices : null,
        required: body.required !== false,
        order_index: Number.isFinite(Number(body.orderIndex))
          ? Number(body.orderIndex)
          : 0,
      });

      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "remove_question") {
      const questionId = Number(body.questionId);
      if (!Number.isFinite(questionId) || questionId <= 0) {
        return NextResponse.json(
          { ok: false, error: "questionId is required" },
          { status: 400 },
        );
      }
      const { error } = await supabase
        .from("booking_questions")
        .delete()
        .eq("id", questionId);
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "adjust_scoping_logic") {
      const config = body.config ?? {};
      const { error } = await supabase
        .from("booking_engine_settings")
        .upsert({ key: "scoping_logic", value: config });
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "adjust_pricing_logic") {
      const config = body.config ?? {};
      const { error } = await supabase
        .from("booking_engine_settings")
        .upsert({ key: "pricing_logic", value: config });
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to update booking intelligence",
      },
      { status: 500 },
    );
  }
}
