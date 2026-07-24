import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { logReputationEvent } from "@/lib/reputation/service";

type CreateDisputeBody = {
  bookingId?: number | string;
  userId?: string;
  vendorId?: string;
  reason?: string;
};

export async function POST(request: Request) {
  let body: CreateDisputeBody;
  try {
    body = (await request.json()) as CreateDisputeBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const bookingId = Number(body.bookingId);
  const userId = String(body.userId ?? "").trim();
  const vendorId = String(body.vendorId ?? "").trim();
  const reason = String(body.reason ?? "").trim();

  if (
    !Number.isFinite(bookingId) ||
    bookingId <= 0 ||
    !userId ||
    !vendorId ||
    !reason
  ) {
    return NextResponse.json(
      { ok: false, error: "bookingId, userId, vendorId, reason are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .insert({
        booking_id: bookingId,
        user_id: userId,
        vendor_id: vendorId,
        reason,
        status: "open",
      })
      .select("id")
      .single();

    if (disputeError) {
      return NextResponse.json(
        { ok: false, error: disputeError.message },
        { status: 500 },
      );
    }

    await supabase.from("notifications").insert([
      {
        user_id: null,
        vendor_id: vendorId,
        type: "dispute_opened",
        message: `Dispute ${dispute.id} opened for booking ${bookingId}.`,
      },
      {
        user_id: "admin",
        vendor_id: null,
        type: "dispute_opened",
        message: `Dispute ${dispute.id} requires review for booking ${bookingId}.`,
      },
    ]);

    await logReputationEvent({
      userId,
      type: "dispute_opened",
    });

    return NextResponse.json({ ok: true, disputeId: dispute.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to create dispute",
      },
      { status: 500 },
    );
  }
}
