import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  assignmentId?: number | string;
  status?: "assigned" | "in_progress" | "completed";
};

const ALLOWED = new Set(["assigned", "in_progress", "completed"]);

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

  const assignmentId = Number(body.assignmentId);
  const status = String(body.status ?? "").trim();

  if (
    !Number.isFinite(assignmentId) ||
    assignmentId <= 0 ||
    !ALLOWED.has(status)
  ) {
    return NextResponse.json(
      { ok: false, error: "assignmentId and valid status are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: now,
    };
    if (status === "in_progress") {
      updatePayload.started_at = now;
    }
    if (status === "completed") {
      updatePayload.completed_at = now;
    }

    const { data: assignment, error } = await supabase
      .from("job_assignments")
      .update(updatePayload)
      .eq("id", assignmentId)
      .select("id, booking_id, staff_id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!assignment) {
      return NextResponse.json(
        { ok: false, error: "Assignment not found" },
        { status: 404 },
      );
    }

    await supabase
      .from("staff")
      .update({ last_activity: now })
      .eq("id", assignment.staff_id);

    const eventStatus =
      status === "in_progress"
        ? "in_progress"
        : status === "completed"
          ? "completed"
          : "scheduled";
    await supabase
      .from("vendor_calendar_events")
      .update({ status: eventStatus })
      .eq("booking_id", assignment.booking_id)
      .eq("staff_id", assignment.staff_id)
      .neq("status", "cancelled");

    if (status === "completed") {
      await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", assignment.booking_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update assignment",
      },
      { status: 500 },
    );
  }
}
