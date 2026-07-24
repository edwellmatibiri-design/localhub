import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { getPaymentClient } from "@/lib/payments/client";

type BoostType =
  | "search_boost"
  | "featured_vendor"
  | "featured_listing"
  | "category_sponsor"
  | "location_sponsor";

type PurchaseBody = {
  vendorId?: string;
  type?: BoostType;
  target?: string;
  durationDays?: number;
  amount?: number;
};

const ALLOWED_TYPES: BoostType[] = [
  "search_boost",
  "featured_vendor",
  "featured_listing",
  "category_sponsor",
  "location_sponsor",
];
const ALLOWED_DURATIONS = new Set([7, 14, 30]);

export async function POST(request: Request) {
  let body: PurchaseBody;
  try {
    body = (await request.json()) as PurchaseBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const vendorId = String(body.vendorId ?? "").trim();
  const type = String(body.type ?? "").trim() as BoostType;
  const target = String(body.target ?? "").trim() || null;
  const durationDays = Number(body.durationDays);
  const amount = Number(body.amount);

  if (!vendorId || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { ok: false, error: "vendorId and valid type are required" },
      { status: 400 },
    );
  }

  if (
    !ALLOWED_DURATIONS.has(durationDays) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "durationDays must be 7, 14, or 30 and amount must be > 0",
      },
      { status: 400 },
    );
  }

  if ((type === "category_sponsor" || type === "location_sponsor") && !target) {
    return NextResponse.json(
      { ok: false, error: "target is required for sponsor boosts" },
      { status: 400 },
    );
  }

  try {
    const now = Date.now();
    const endDate = new Date(
      now + durationDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const paymentClient = getPaymentClient();

    const paymentIntent = await paymentClient.paymentIntents.create({
      amount,
      currency: "zar",
      metadata: {
        vendorId,
        boostType: type,
        durationDays: String(durationDays),
        target: target ?? "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const supabase = createServiceClient();
    const { data: boost, error } = await supabase
      .from("boosts")
      .insert({
        vendor_id: vendorId,
        type,
        target,
        end_date: endDate,
        amount,
        status: "pending_payment",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      boostId: Number(boost.id),
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      authorizationUrl: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to purchase boost",
      },
      { status: 500 },
    );
  }
}
