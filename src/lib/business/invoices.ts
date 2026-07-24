import { createServiceClient } from "@/lib/db";
import { renderSimplePdf } from "@/lib/business/pdf";

export type InvoiceItemInput = {
  description: string;
  qty: number;
  price: number;
};

type InvoiceRow = {
  id: number;
  vendor_id: string;
  user_id: string;
  booking_id: number | null;
  invoice_number: string;
  items: InvoiceItemInput[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  created_at: string;
  updated_at: string;
};

export function calculateInvoiceTotals(items: InvoiceItemInput[]) {
  const normalizedItems = items
    .map((item) => ({
      description: String(item.description ?? "").trim(),
      qty: Math.max(1, Math.round(Number(item.qty ?? 1))),
      price: Math.max(0, Math.round(Number(item.price ?? 0))),
    }))
    .filter((item) => item.description.length > 0);

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + item.qty * item.price,
    0,
  );
  const tax = Math.round(subtotal * 0.15);
  const total = subtotal + tax;

  return { normalizedItems, subtotal, tax, total };
}

export function generateInvoiceNumber(vendorId: string) {
  const compactVendor =
    String(vendorId)
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 12) || "VENDOR";
  return `LH-INV-${Date.now()}-${compactVendor.toUpperCase()}`;
}

export async function createInvoiceDraft(input: {
  vendorId: string;
  userId: string;
  bookingId?: number | null;
  items: InvoiceItemInput[];
}) {
  const vendorId = String(input.vendorId ?? "").trim();
  const userId = String(input.userId ?? "").trim();
  if (!vendorId || !userId) {
    throw new Error("vendorId and userId are required");
  }

  const { normalizedItems, subtotal, tax, total } = calculateInvoiceTotals(
    input.items,
  );
  if (!normalizedItems.length) {
    throw new Error("At least one valid invoice item is required");
  }

  const supabase = createServiceClient();
  const invoiceNumber = generateInvoiceNumber(vendorId);

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      vendor_id: vendorId,
      user_id: userId,
      booking_id: Number.isFinite(input.bookingId)
        ? Number(input.bookingId)
        : null,
      invoice_number: invoiceNumber,
      items: normalizedItems,
      subtotal,
      tax,
      total,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return Number(data.id);
}

export async function getInvoiceById(invoiceId: number) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, vendor_id, user_id, booking_id, invoice_number, items, subtotal, tax, total, status, created_at, updated_at",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as InvoiceRow | null) ?? null;
}

export function renderInvoicePdf(invoice: InvoiceRow) {
  const lines: string[] = [
    "LocalHub Invoice",
    `Invoice Number: ${invoice.invoice_number}`,
    `Invoice ID: ${invoice.id}`,
    `Vendor: ${invoice.vendor_id}`,
    `User: ${invoice.user_id}`,
    `Booking: ${invoice.booking_id ?? "-"}`,
    `Status: ${invoice.status}`,
    "",
    "Items:",
  ];

  (invoice.items ?? []).forEach((item, index) => {
    const qty = Number(item.qty ?? 0);
    const price = Number(item.price ?? 0);
    lines.push(
      `${index + 1}. ${item.description} | Qty ${qty} | Price ${price} | Line ${qty * price}`,
    );
  });

  lines.push("");
  lines.push(`Subtotal: ${invoice.subtotal}`);
  lines.push(`Tax: ${invoice.tax}`);
  lines.push(`Total: ${invoice.total}`);
  lines.push(`Generated: ${new Date().toISOString()}`);

  return renderSimplePdf(lines);
}

export async function markInvoicePaidByBookingId(bookingId: number) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .in("status", ["draft", "sent", "overdue"]);

  if (error) {
    throw new Error(error.message);
  }
}
