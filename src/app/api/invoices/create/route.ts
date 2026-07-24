import { NextResponse } from "next/server";
import {
  createInvoiceDraft,
  type InvoiceItemInput,
} from "@/lib/business/invoices";

type Body = {
  vendorId?: string;
  userId?: string;
  bookingId?: number | string;
  items?: InvoiceItemInput[];
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
  const items = Array.isArray(body.items) ? body.items : [];

  if (!vendorId || !userId || items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "vendorId, userId and items are required" },
      { status: 400 },
    );
  }

  try {
    const invoiceId = await createInvoiceDraft({
      vendorId,
      userId,
      bookingId: Number.isFinite(bookingId) && bookingId > 0 ? bookingId : null,
      items,
    });

    return NextResponse.json({ ok: true, invoiceId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to create invoice",
      },
      { status: 500 },
    );
  }
}
