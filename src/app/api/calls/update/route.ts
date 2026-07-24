import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { runAutoFollowupForMissedCall } from "@/lib/comms/autoFollowup";

type Body = {
  callId?: number | string;
  status?: "missed" | "answered" | "declined";
  endedAt?: string;
  duration?: number | string;
  recordingUrl?: string | null;
};

const ALLOWED_STATUS = new Set(["missed", "answered", "declined"]);

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

  const callId = Number(body.callId);
  const status = String(body.status ?? "").trim();

  if (!Number.isFinite(callId) || callId <= 0 || !ALLOWED_STATUS.has(status)) {
    return NextResponse.json(
      { ok: false, error: "callId and valid status are required" },
      { status: 400 },
    );
  }

  const durationValue = Number(body.duration);

  try {
    const supabase = createServiceClient();

    const { data: callLog, error: fetchError } = await supabase
      .from("call_logs")
      .select("id, vendor_id, user_id, lead_id")
      .eq("id", callId)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!callLog) {
      return NextResponse.json(
        { ok: false, error: "Call log not found" },
        { status: 404 },
      );
    }

    const payload: Record<string, unknown> = {
      status,
    };

    if (body.endedAt !== undefined) {
      payload.ended_at = body.endedAt
        ? new Date(body.endedAt).toISOString()
        : null;
    }

    if (body.duration !== undefined) {
      if (!Number.isFinite(durationValue) || durationValue < 0) {
        return NextResponse.json(
          { ok: false, error: "duration must be a non-negative number" },
          { status: 400 },
        );
      }
      payload.duration = Math.round(durationValue);
    }

    if (body.recordingUrl !== undefined) {
      payload.recording_url = body.recordingUrl
        ? String(body.recordingUrl).trim()
        : null;
    }

    const { error } = await supabase
      .from("call_logs")
      .update(payload)
      .eq("id", callId);
    if (error) throw new Error(error.message);

    if (status === "missed") {
      await runAutoFollowupForMissedCall({
        vendorId: String(callLog.vendor_id),
        userId: String(callLog.user_id),
        leadId: Number(callLog.lead_id),
        callId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update call",
      },
      { status: 500 },
    );
  }
}
