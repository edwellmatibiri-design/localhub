import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import {
  calculateInvoiceTotals,
  type InvoiceItemInput,
} from "@/lib/business/invoices";
import {
  applyInvoicePaidToCurrentPeriod,
  regenerateCurrentMonthStatement,
} from "@/lib/financial/metrics";

type Body = {
  invoiceId?: number | string;
  action?: "edit" | "send" | "mark_paid" | "mark_overdue";
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

  const invoiceId = Number(body.invoiceId);
  const action = String(body.action ?? "").trim();

  if (!Number.isFinite(invoiceId) || invoiceId <= 0 || !action) {
    return NextResponse.json(
      { ok: false, error: "invoiceId and action are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    if (action === "edit") {
      const items = Array.isArray(body.items) ? body.items : [];
      const totals = calculateInvoiceTotals(items);
      if (totals.normalizedItems.length === 0) {
        return NextResponse.json(
          { ok: false, error: "At least one valid item is required" },
          { status: 400 },
        );
      }

      const { error } = await supabase
        .from("invoices")
        .update({
          items: totals.normalizedItems,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    const status =
      action === "send"
        ? "sent"
        : action === "mark_paid"
          ? "paid"
          : action === "mark_overdue"
            ? "overdue"
            : null;

    if (!status) {
      return NextResponse.json(
        { ok: false, error: "Unsupported action" },
        { status: 400 },
      );
    }

    const { data: updatedInvoice, error } = await supabase
      .from("invoices")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", invoiceId)
      .select("id, vendor_id, total, tax")
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (status === "paid" && updatedInvoice?.vendor_id) {
      await regenerateCurrentMonthStatement(String(updatedInvoice.vendor_id));
      await applyInvoicePaidToCurrentPeriod(
        String(updatedInvoice.vendor_id),
        Number(updatedInvoice.total ?? 0),
        Number(updatedInvoice.tax ?? 0),
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update invoice",
      },
      { status: 500 },
    );
  }
}
