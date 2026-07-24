import { NextResponse } from "next/server";
import { runAutoFlagging } from "@/lib/quality/autoFlag";
import { getVendorQualityData } from "@/lib/quality/scoring";
import { suppressVendor } from "@/lib/quality/suppressVendor";

type Body = {
  vendorId?: string;
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
  if (!vendorId) {
    return NextResponse.json(
      { ok: false, error: "vendorId is required" },
      { status: 400 },
    );
  }

  try {
    await runAutoFlagging();

    const { vendorQualityScore } = await getVendorQualityData(vendorId);
    await suppressVendor(vendorId, vendorQualityScore);

    return NextResponse.json({ vendorId, vendorQualityScore });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to compute quality score",
      },
      { status: 500 },
    );
  }
}
