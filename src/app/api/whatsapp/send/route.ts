import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  vendorId?: string;
  userId?: string;
  message?: string;
  leadId?: number | string | null;
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

  const vendorId = String(body.vendorId ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const message = String(body.message ?? "").trim();
  const leadId = Number(body.leadId);

  if (!vendorId || !userId || !message) {
    return NextResponse.json(
      { ok: false, error: "vendorId, userId, and message are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    // Placeholder WhatsApp provider integration.
    const providerMessageId = `wa_mock_${Date.now()}`;

    const { error: noteError } = await supabase.from("crm_notes").insert({
      vendor_id: vendorId,
      user_id: userId,
      lead_id: Number.isFinite(leadId) && leadId > 0 ? leadId : null,
      note: `WhatsApp (${providerMessageId}): ${message}`,
    });

    if (noteError) throw new Error(noteError.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send WhatsApp message",
      },
      { status: 500 },
    );
  }
}
