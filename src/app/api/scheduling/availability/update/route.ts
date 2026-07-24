import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type AvailabilityInput = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type Body = {
  staffId?: number | string;
  availability?: AvailabilityInput[];
};

function isValidTime(value: string) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
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

  const valid = availability.every((slot) => {
    const day = Number(slot.day_of_week);
    return (
      Number.isInteger(day) &&
      day >= 0 &&
      day <= 6 &&
      isValidTime(String(slot.start_time ?? "")) &&
      isValidTime(String(slot.end_time ?? ""))
    );
  });

  if (!valid) {
    return NextResponse.json(
      { ok: false, error: "Invalid availability records" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { error: deleteError } = await supabase
      .from("staff_availability")
      .delete()
      .eq("staff_id", staffId);
    if (deleteError) {
      return NextResponse.json(
        { ok: false, error: deleteError.message },
        { status: 500 },
      );
    }

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
      if (insertError) {
        return NextResponse.json(
          { ok: false, error: insertError.message },
          { status: 500 },
        );
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to update availability",
      },
      { status: 500 },
    );
  }
}
