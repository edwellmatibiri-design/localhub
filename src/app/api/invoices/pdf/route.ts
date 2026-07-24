import { NextResponse } from "next/server";
import { getInvoiceById, renderInvoicePdf } from "@/lib/business/invoices";

type Body = { invoiceId?: number | string };

function parseInvoiceIdFromUrl(url: string) {
  const value = new URL(url).searchParams.get("invoiceId");
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request) {
  const invoiceId = parseInvoiceIdFromUrl(request.url);
  if (!invoiceId) {
    return NextResponse.json(
      { ok: false, error: "invoiceId is required" },
      { status: 400 },
    );
  }

  try {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    const pdf = renderInvoicePdf(invoice);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${invoice.invoice_number}.pdf\"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to render invoice PDF",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: Body | null = null;
  try {
    body = (await request.json()) as Body;
  } catch {
    try {
      const formData = await request.formData();
      body = { invoiceId: String(formData.get("invoiceId") ?? "") };
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 },
      );
    }
  }

  const invoiceId = Number(body?.invoiceId);
  if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
    return NextResponse.json(
      { ok: false, error: "invoiceId is required" },
      { status: 400 },
    );
  }

  try {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { ok: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    const pdf = renderInvoicePdf(invoice);

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${invoice.invoice_number}.pdf\"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to render invoice PDF",
      },
      { status: 500 },
    );
  }
}
