import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  vendorId?: string;
  staffId?: number | string;
  bookingId?: number | string;
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
};

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const startA = Date.parse(aStart);
  const endA = Date.parse(aEnd);
  const startB = Date.parse(bStart);
  const endB = Date.parse(bEnd);
  return startA < endB && endA > startB;
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

  const vendorId = String(body.vendorId ?? "").trim();
  const staffId = Number(body.staffId);
  const bookingId = Number(body.bookingId);
  const title = String(body.title ?? "").trim();
  const description = body.description ? String(body.description) : null;
  const startAt = String(body.startAt ?? "").trim();
  const endAt = String(body.endAt ?? "").trim();

  if (!vendorId || !title || !startAt || !endAt) {
    return NextResponse.json(
      { ok: false, error: "vendorId, title, startAt, endAt are required" },
      { status: 400 },
    );
  }

  if (Date.parse(startAt) >= Date.parse(endAt)) {
    return NextResponse.json(
      { ok: false, error: "endAt must be after startAt" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const normalizedStaffId =
      Number.isFinite(staffId) && staffId > 0 ? staffId : null;
    const normalizedBookingId =
      Number.isFinite(bookingId) && bookingId > 0 ? bookingId : null;

    if (normalizedStaffId) {
      const { data: existingEvents, error: readError } = await supabase
        .from("vendor_calendar_events")
        .select("id, start_at, end_at")
        .eq("staff_id", normalizedStaffId)
        .neq("status", "cancelled")
        .gte(
          "end_at",
          new Date(Date.parse(startAt) - 24 * 60 * 60 * 1000).toISOString(),
        )
        .lte(
          "start_at",
          new Date(Date.parse(endAt) + 24 * 60 * 60 * 1000).toISOString(),
        );

      if (readError) {
        return NextResponse.json(
          { ok: false, error: readError.message },
          { status: 500 },
        );
      }

      const hasOverlap = (existingEvents ?? []).some((event) =>
        overlaps(startAt, endAt, String(event.start_at), String(event.end_at)),
      );
      if (hasOverlap) {
        await supabase.from("notifications").insert({
          user_id: null,
          vendor_id: vendorId,
          type: "double_booking_prevented",
          message: `Double-booking prevented for staff ${normalizedStaffId} between ${startAt} and ${endAt}.`,
        });

        return NextResponse.json(
          {
            ok: false,
            error: "Staff member is already booked in this time range",
          },
          { status: 409 },
        );
      }

      const date = new Date(startAt);
      const dayOfWeek = date.getUTCDay();
      const startTime = startAt.slice(11, 19);
      const endTime = endAt.slice(11, 19);

      const { data: availability } = await supabase
        .from("staff_availability")
        .select("id, start_time, end_time")
        .eq("staff_id", normalizedStaffId)
        .eq("day_of_week", dayOfWeek);

      const available = (availability ?? []).some((slot) => {
        const slotStart = String(slot.start_time).slice(0, 8);
        const slotEnd = String(slot.end_time).slice(0, 8);
        return startTime >= slotStart && endTime <= slotEnd;
      });

      if (!available) {
        await supabase.from("notifications").insert({
          user_id: null,
          vendor_id: vendorId,
          type: "staff_unavailable",
          message: `Staff ${normalizedStaffId} unavailable for selected time ${startAt} - ${endAt}.`,
        });
      }
    }

    const { data: created, error } = await supabase
      .from("vendor_calendar_events")
      .insert({
        vendor_id: vendorId,
        staff_id: normalizedStaffId,
        booking_id: normalizedBookingId,
        title,
        description,
        start_at: startAt,
        end_at: endAt,
        status: "scheduled",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    if (normalizedStaffId) {
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: vendorId,
        type: "new_job_assigned",
        message: `New job assigned to staff ${normalizedStaffId}: ${title}.`,
      });

      if (Date.parse(startAt) - Date.now() <= 60 * 60 * 1000) {
        await supabase.from("notifications").insert({
          user_id: null,
          vendor_id: vendorId,
          type: "job_starting_soon",
          message: `Job starting soon for staff ${normalizedStaffId}: ${title}.`,
        });
      }
    }

    if (normalizedBookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("id", normalizedBookingId)
        .maybeSingle();

      if (booking?.user_id) {
        await supabase.from("notifications").insert({
          user_id: String(booking.user_id),
          vendor_id: null,
          type: "job_scheduled",
          message: `Your job has been scheduled for ${startAt}.`,
        });
      }
    }

    return NextResponse.json({ ok: true, eventId: Number(created.id) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create calendar event",
      },
      { status: 500 },
    );
  }
}
