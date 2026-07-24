import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  action?: "force_reschedule" | "clear_events" | "adjust_availability";
  eventId?: number | string;
  vendorId?: string;
  startAt?: string;
  endAt?: string;
  staffId?: number | string;
  availability?: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
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

  const action = String(body.action ?? "").trim();
  const supabase = createServiceClient();

  try {
    if (action === "clear_events") {
      const vendorId = String(body.vendorId ?? "").trim();
      if (!vendorId)
        return NextResponse.json(
          { ok: false, error: "vendorId is required" },
          { status: 400 },
        );
      const { error } = await supabase
        .from("vendor_calendar_events")
        .delete()
        .eq("vendor_id", vendorId);
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "force_reschedule") {
      const eventId = Number(body.eventId);
      if (
        !Number.isFinite(eventId) ||
        eventId <= 0 ||
        !body.startAt ||
        !body.endAt
      ) {
        return NextResponse.json(
          { ok: false, error: "eventId, startAt, endAt are required" },
          { status: 400 },
        );
      }
      const { error } = await supabase
        .from("vendor_calendar_events")
        .update({ start_at: String(body.startAt), end_at: String(body.endAt) })
        .eq("id", eventId);
      if (error)
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 },
        );
      return NextResponse.json({ ok: true });
    }

    if (action === "adjust_availability") {
      const staffId = Number(body.staffId);
      const availability = Array.isArray(body.availability)
        ? body.availability
        : [];
      if (!Number.isFinite(staffId) || staffId <= 0) {
        return NextResponse.json(
          { ok: false, error: "staffId is required" },
          { status: 400 },
        );
      }
      const { error: deleteError } = await supabase
        .from("staff_availability")
        .delete()
        .eq("staff_id", staffId);
      if (deleteError)
        return NextResponse.json(
          { ok: false, error: deleteError.message },
          { status: 500 },
        );
      if (availability.length > 0) {
        const { error: insertError } = await supabase
          .from("staff_availability")
          .insert(
            availability.map((slot) => ({
              staff_id: staffId,
              day_of_week: Number(slot.day_of_week),
              start_time: slot.start_time,
              end_time: slot.end_time,
            })),
          );
        if (insertError)
          return NextResponse.json(
            { ok: false, error: insertError.message },
            { status: 500 },
          );
      }
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
            : "Failed admin scheduling action",
      },
      { status: 500 },
    );
  }
}
