import { NextResponse } from "next/server";
import { upsertFinancialStatement } from "@/lib/financial/metrics";

type Body = {
  vendorId?: string;
  periodStart?: string;
  periodEnd?: string;
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
  const periodStart = String(body.periodStart ?? "").trim();
  const periodEnd = String(body.periodEnd ?? "").trim();

  if (!vendorId || !periodStart || !periodEnd) {
    return NextResponse.json(
      { ok: false, error: "vendorId, periodStart, periodEnd are required" },
      { status: 400 },
    );
  }

  try {
    const result = await upsertFinancialStatement({
      vendorId,
      periodStart,
      periodEnd,
    });
    return NextResponse.json({ ok: true, statementId: result.statementId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate statement",
      },
      { status: 500 },
    );
  }
}
