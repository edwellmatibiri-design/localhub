import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  vendorId?: string;
  action?: "suppress" | "restore" | "ban";
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
  const action = String(body.action ?? "").trim();

  if (!vendorId || !["suppress", "restore", "ban"].includes(action)) {
    return NextResponse.json(
      { ok: false, error: "vendorId and valid action are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    if (action === "suppress") {
      await supabase
        .from("listings")
        .update({ is_active: false, status: "blocked" })
        .eq("seller_id", vendorId);
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: vendorId,
        type: "listings_suppressed",
        message: "Your listings have been suppressed by admin.",
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "restore") {
      await supabase
        .from("listings")
        .update({ is_active: true, status: "approved" })
        .eq("seller_id", vendorId)
        .eq("status", "blocked");
      await supabase.from("notifications").insert({
        user_id: null,
        vendor_id: vendorId,
        type: "visibility_restored",
        message: "Your marketplace visibility has been restored.",
      });
      return NextResponse.json({ ok: true });
    }

    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: vendorId,
      type: "vendor_ban_placeholder",
      message: "Your account is under review for a potential ban.",
    });
    return NextResponse.json({
      ok: true,
      note: "Ban placeholder action executed",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed vendor action",
      },
      { status: 500 },
    );
  }
}
