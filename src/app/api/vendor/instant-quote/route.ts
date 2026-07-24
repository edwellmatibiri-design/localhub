import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { generateVendorInstantQuote } from "@/lib/ai/vendorInstantQuote";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";

type Body = {
  bookingId?: number | string;
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

  const bookingId = Number(body.bookingId);
  if (!Number.isFinite(bookingId) || bookingId <= 0) {
    return NextResponse.json(
      { ok: false, error: "bookingId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, vendor_id, user_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError)
      return NextResponse.json(
        { ok: false, error: bookingError.message },
        { status: 500 },
      );
    if (!booking)
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 },
      );

    const { data: scopeRow, error: scopeError } = await supabase
      .from("booking_scopes")
      .select(
        "id, category, job_size, job_complexity, estimated_duration, answers, job_summary, instant_quote_min, instant_quote_max",
      )
      .eq("user_id", String(booking.user_id))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (scopeError)
      return NextResponse.json(
        { ok: false, error: scopeError.message },
        { status: 500 },
      );
    if (!scopeRow)
      return NextResponse.json(
        { ok: false, error: "No booking scope found for this booking" },
        { status: 404 },
      );

    const { data: answerRows } = await supabase
      .from("booking_answers")
      .select("id, question_id, answer")
      .eq("booking_id", Number(scopeRow.id));

    const quote = generateVendorInstantQuote({
      jobSize: String(scopeRow.job_size ?? "small") as
        | "small"
        | "medium"
        | "large",
      jobComplexity: String(scopeRow.job_complexity ?? "low") as
        | "low"
        | "medium"
        | "high",
      estimatedDuration: Number(scopeRow.estimated_duration ?? 2),
      category: String(scopeRow.category ?? "general"),
    });

    const { error: saveError } = await supabase
      .from("vendor_crm_quotes")
      .insert({
        booking_id: bookingId,
        vendor_id: String(booking.vendor_id),
        category: String(scopeRow.category ?? "general"),
        job_size: String(scopeRow.job_size ?? "small"),
        job_complexity: String(scopeRow.job_complexity ?? "low"),
        estimated_duration: Number(scopeRow.estimated_duration ?? 2),
        min_price: quote.minPrice,
        max_price: quote.maxPrice,
        confidence: quote.confidence,
        source: "instant_quote",
        metadata: {
          bookingScopeId: Number(scopeRow.id),
          bookingAnswersCount: Number(answerRows?.length ?? 0),
          legacyInstantQuote: {
            min: Number(scopeRow.instant_quote_min ?? 0),
            max: Number(scopeRow.instant_quote_max ?? 0),
          },
        },
      });

    if (saveError)
      return NextResponse.json(
        { ok: false, error: saveError.message },
        { status: 500 },
      );

    await upsertCrmPipeline({
      vendorId: String(booking.vendor_id),
      bookingId,
      stage: "quote_sent",
      valueEstimate: quote.maxPrice,
      probability: 60,
      metadata: {
        source: "api:vendor:instant-quote",
        instantQuote: quote,
      },
    });

    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate vendor instant quote",
      },
      { status: 500 },
    );
  }
}
