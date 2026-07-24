import Link from "next/link";
import { createServiceClient } from "@/lib/db";

type Params = { invoiceId: string };

export const dynamic = "force-dynamic";

export default async function AccountInvoicePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { invoiceId: invoiceIdParam } = await params;
  const invoiceId = Number(invoiceIdParam);
  if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-danger text-sm">Invalid invoice ID.</p>
        </div>
      </section>
    );
  }

  const supabase = createServiceClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, vendor_id, user_id, booking_id, invoice_number, items, subtotal, tax, total, status, created_at, updated_at",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-danger text-sm">Invoice not found.</p>
        </div>
      </section>
    );
  }

  const bookingId = Number(invoice.booking_id);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">
        Invoice {String(invoice.invoice_number)}
      </h1>

      <article className="card space-y-2">
        <p className="text-lh-muted text-sm">
          Vendor: {String(invoice.vendor_id)}
        </p>
        <p className="text-lh-muted text-sm">User: {String(invoice.user_id)}</p>
        <p className="text-lh-muted text-sm">
          Status: {String(invoice.status)}
        </p>
        <p className="text-lh-muted text-sm">
          Created: {new Date(String(invoice.created_at)).toLocaleString()}
        </p>
      </article>

      <article className="card space-y-2">
        <h2 className="text-lg font-semibold">Items</h2>
        {Array.isArray(invoice.items) && invoice.items.length > 0 ? (
          (
            invoice.items as Array<{
              description?: string;
              qty?: number;
              price?: number;
            }>
          ).map((item, index) => (
            <p key={index} className="text-lh-muted text-sm">
              {String(item.description ?? "Item")}: {Number(item.qty ?? 0)} x R{" "}
              {Number(item.price ?? 0).toLocaleString("en-ZA")}
            </p>
          ))
        ) : (
          <p className="text-lh-muted text-sm">No invoice items.</p>
        )}
        <div className="grid gap-1 text-sm md:grid-cols-3">
          <p>
            Subtotal: R {Number(invoice.subtotal ?? 0).toLocaleString("en-ZA")}
          </p>
          <p>Tax: R {Number(invoice.tax ?? 0).toLocaleString("en-ZA")}</p>
          <p>Total: R {Number(invoice.total ?? 0).toLocaleString("en-ZA")}</p>
        </div>
      </article>

      <div className="flex flex-wrap gap-2">
        {Number.isFinite(bookingId) && bookingId > 0 ? (
          <Link
            href={`/bookings/${bookingId}/pay`}
            className="bg-lh-accent text-lh-on-accent rounded px-4 py-2 text-sm"
          >
            Pay invoice
          </Link>
        ) : (
          <span className="border-lh-border text-lh-muted rounded border px-4 py-2 text-sm">
            No linked booking for payment
          </span>
        )}

        <Link
          href={`/api/invoices/pdf?invoiceId=${invoice.id}`}
          target="_blank"
          className="border-lh-border rounded border px-4 py-2 text-sm"
        >
          Download PDF
        </Link>
      </div>
    </section>
  );
}
