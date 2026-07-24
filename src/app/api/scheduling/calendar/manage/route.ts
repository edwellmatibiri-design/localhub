import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  eventId?: number | string;
  action?: "reschedule" | "update" | "status" | "delete";
  title?: string;
  description?: string;
  staffId?: number | string | null;
  startAt?: string;
  endAt?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
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

  const eventId = Number(body.eventId);
  const action = String(body.action ?? "").trim();

  if (!Number.isFinite(eventId) || eventId <= 0 || !action) {
    return NextResponse.json(
      { ok: false, error: "eventId and action are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: existing, error: existingError } = await supabase
      .from("vendor_calendar_events")
      .select("id, vendor_id, staff_id, booking_id, start_at, end_at")
      .eq("id", eventId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 },
      );
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Event not found" },
        { status: 404 },
      );
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("vendor_calendar_events")
        .delete()
        .eq("id", eventId);
      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    const payload: Record<string, unknown> = {};
    if (body.title !== undefined)
      payload.title = String(body.title ?? "").trim();
    if (body.description !== undefined)
      payload.description = body.description ? String(body.description) : null;
    if (body.startAt !== undefined) payload.start_at = String(body.startAt);
    if (body.endAt !== undefined) payload.end_at = String(body.endAt);
    if (body.staffId !== undefined) {
      const parsed = Number(body.staffId);
      payload.staff_id = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    if (body.status) payload.status = body.status;

    const nextStaffId =
      payload.staff_id !== undefined
        ? Number(payload.staff_id)
        : Number(existing.staff_id ?? 0);
    const nextStart = String(payload.start_at ?? existing.start_at);
    const nextEnd = String(payload.end_at ?? existing.end_at);

    if (
      Number.isFinite(nextStaffId) &&
      nextStaffId > 0 &&
      nextStart &&
      nextEnd
    ) {
      const { data: events } = await supabase
        .from("vendor_calendar_events")
        .select("id, start_at, end_at")
        .eq("staff_id", nextStaffId)
        .neq("id", eventId)
        .neq("status", "cancelled")
        .gte(
          "end_at",
          new Date(Date.parse(nextStart) - 24 * 60 * 60 * 1000).toISOString(),
        )
        .lte(
          "start_at",
          new Date(Date.parse(nextEnd) + 24 * 60 * 60 * 1000).toISOString(),
        );

      const hasOverlap = (events ?? []).some((event) =>
        overlaps(
          nextStart,
          nextEnd,
          String(event.start_at),
          String(event.end_at),
        ),
      );
      if (hasOverlap) {
        await supabase.from("notifications").insert({
          user_id: null,
          vendor_id: String(existing.vendor_id),
          type: "double_booking_prevented",
          message: `Double-booking prevented while updating event ${eventId}.`,
        });
        return NextResponse.json(
          { ok: false, error: "Overlapping event exists" },
          { status: 409 },
        );
      }
    }

    const { error } = await supabase
      .from("vendor_calendar_events")
      .update(payload)
      .eq("id", eventId);
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    if (
      action === "status" &&
      body.status === "completed" &&
      existing.booking_id
    ) {
      await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", existing.booking_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to manage event",
      },
      { status: 500 },
    );
  }
}
