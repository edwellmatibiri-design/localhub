import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  bookingId?: number | string;
  staffId?: number | string;
  assignedBy?: string;
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
  const staffId = Number(body.staffId);
  const assignedBy = String(body.assignedBy ?? "").trim();

  if (
    !Number.isFinite(bookingId) ||
    bookingId <= 0 ||
    !Number.isFinite(staffId) ||
    staffId <= 0 ||
    !assignedBy
  ) {
    return NextResponse.json(
      { ok: false, error: "bookingId, staffId, assignedBy are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const [
      { data: booking, error: bookingError },
      { data: staff, error: staffError },
    ] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, vendor_id, job_sheet_document_id")
        .eq("id", bookingId)
        .maybeSingle(),
      supabase
        .from("staff")
        .select("id, vendor_id, name, email")
        .eq("id", staffId)
        .is("disabled_at", null)
        .maybeSingle(),
    ]);

    if (bookingError) throw new Error(bookingError.message);
    if (staffError) throw new Error(staffError.message);
    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 },
      );
    }
    if (!staff) {
      return NextResponse.json(
        { ok: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    const { error } = await supabase.from("job_assignments").insert({
      booking_id: bookingId,
      staff_id: staffId,
      assigned_by: assignedBy,
      job_sheet_document_id: booking.job_sheet_document_id ?? null,
      status: "assigned",
    });

    if (error) throw new Error(error.message);

    // Placeholder staff notification
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: String(staff.vendor_id),
      type: "job_assigned",
      message: `Job ${bookingId} assigned to ${staff.name} (${staff.email}).`,
    });

    const { data: calendarEvent } = await supabase
      .from("vendor_calendar_events")
      .select("id, start_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (calendarEvent?.id) {
      await supabase
        .from("vendor_calendar_events")
        .update({ staff_id: staffId })
        .eq("id", calendarEvent.id);

      if (
        Date.parse(String(calendarEvent.start_at)) - Date.now() <=
        60 * 60 * 1000
      ) {
        await supabase.from("notifications").insert({
          user_id: null,
          vendor_id: String(staff.vendor_id),
          type: "job_starting_soon",
          message: `Job starting soon for ${staff.name}.`,
        });
      }
    }

    await supabase
      .from("staff")
      .update({ last_activity: new Date().toISOString() })
      .eq("id", staffId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to assign job",
      },
      { status: 500 },
    );
  }
}
