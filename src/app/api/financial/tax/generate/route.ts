import { NextResponse } from "next/server";
import { generateTaxReport } from "@/lib/financial/metrics";

type Body = {
  vendorId?: string;
  year?: number | string;
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
  const year = Number(body.year);

  if (!vendorId || !Number.isFinite(year) || year <= 0) {
    return NextResponse.json(
      { ok: false, error: "vendorId and year are required" },
      { status: 400 },
    );
  }

  try {
    const result = await generateTaxReport(vendorId, year);
    return NextResponse.json({ ok: true, taxReportId: result.taxReportId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate tax report",
      },
      { status: 500 },
    );
  }
}
