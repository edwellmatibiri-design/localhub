import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { logReputationEvent } from "@/lib/reputation/service";

type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";

type UpdateDisputeBody = {
  disputeId?: number | string;
  status?: DisputeStatus;
  resolution?: string;
};

const ALLOWED: Set<DisputeStatus> = new Set([
  "open",
  "under_review",
  "resolved",
  "rejected",
]);

export async function POST(request: Request) {
  let body: UpdateDisputeBody;
  try {
    body = (await request.json()) as UpdateDisputeBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const disputeId = Number(body.disputeId);
  const status = String(body.status ?? "").trim() as DisputeStatus;
  const resolution =
    typeof body.resolution === "string" ? body.resolution.trim() : null;

  if (!Number.isFinite(disputeId) || disputeId <= 0 || !ALLOWED.has(status)) {
    return NextResponse.json(
      { ok: false, error: "disputeId and valid status are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: existing, error: existingError } = await supabase
      .from("disputes")
      .select("id, booking_id, user_id, vendor_id")
      .eq("id", disputeId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 },
      );
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Dispute not found" },
        { status: 404 },
      );
    }

    const patch: {
      status: DisputeStatus;
      updated_at: string;
      resolution?: string | null;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (resolution) {
      patch.resolution = resolution;
    }

    const { error: updateError } = await supabase
      .from("disputes")
      .update(patch)
      .eq("id", disputeId);
    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 },
      );
    }

    if (status === "resolved") {
      await supabase.from("notifications").insert([
        {
          user_id: existing.user_id,
          vendor_id: null,
          type: "dispute_resolved",
          message: `Dispute ${disputeId} was resolved for booking ${existing.booking_id}.`,
        },
        {
          user_id: null,
          vendor_id: existing.vendor_id,
          type: "dispute_resolved",
          message: `Dispute ${disputeId} was resolved for booking ${existing.booking_id}.`,
        },
      ]);

      await logReputationEvent({
        userId: String(existing.user_id),
        type: "dispute_resolved",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update dispute",
      },
      { status: 500 },
    );
  }
}
