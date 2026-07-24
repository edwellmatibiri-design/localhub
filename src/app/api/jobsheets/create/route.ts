import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { createJobSheetDocument } from "@/lib/business/documents";

type Body = {
  bookingId?: number | string;
  vendorId?: string;
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
  const vendorId = String(body.vendorId ?? "").trim();

  if (!Number.isFinite(bookingId) || bookingId <= 0 || !vendorId) {
    return NextResponse.json(
      { ok: false, error: "bookingId and vendorId are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, vendor_id, user_id, quote_id, preferred_date, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: bookingError.message },
        { status: 500 },
      );
    }

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    const { data: quote } = await supabase
      .from("quotes")
      .select("message")
      .eq("id", Number(booking.quote_id))
      .maybeSingle();

    const { data: profile } = await supabase
      .from("seller_profiles")
      .select("business_name")
      .eq("id", vendorId)
      .maybeSingle();

    const { data: suburb } = await supabase
      .from("suburbs")
      .select("name, city")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const location = suburb
      ? `${String(suburb.name ?? "")}, ${String(suburb.city ?? "")}`
      : "TBD";

    const jobSheetId = await createJobSheetDocument({
      bookingId,
      vendorId,
      userId: String(booking.user_id),
      serviceDescription: String(
        quote?.message ?? `Service for booking ${bookingId}`,
      ),
      dateTime: String(booking.preferred_date ?? new Date().toISOString()),
      location,
      notes: `Vendor: ${String(profile?.business_name ?? vendorId)} | Booking status: ${String(booking.status ?? "new")}`,
    });

    await supabase
      .from("documents")
      .update({ booking_id: bookingId })
      .eq("id", jobSheetId);
    await supabase
      .from("bookings")
      .update({ job_sheet_document_id: jobSheetId })
      .eq("id", bookingId);

    return NextResponse.json({ ok: true, jobSheetId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate job sheet",
      },
      { status: 500 },
    );
  }
}
