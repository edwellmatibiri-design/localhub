import { NextResponse } from "next/server";
import { createContractDocument } from "@/lib/business/documents";
import { createServiceClient } from "@/lib/db";

type Body = {
  vendorId?: string;
  userId?: string;
  bookingId?: number | string;
  terms?: string;
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
  const bookingId = Number(body.bookingId);
  const terms = String(body.terms ?? "").trim();

  if (
    !vendorId ||
    !userId ||
    !Number.isFinite(bookingId) ||
    bookingId <= 0 ||
    !terms
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "vendorId, userId, bookingId and terms are required",
      },
      { status: 400 },
    );
  }

  try {
    const contractId = await createContractDocument({
      vendorId,
      userId,
      bookingId,
      terms,
    });

    const supabase = createServiceClient();
    await supabase
      .from("documents")
      .update({ booking_id: bookingId })
      .eq("id", contractId);

    return NextResponse.json({ ok: true, contractId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate contract",
      },
      { status: 500 },
    );
  }
}
