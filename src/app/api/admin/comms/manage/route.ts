import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  action?:
    | "disable_vendor_calling"
    | "enable_vendor_calling"
    | "remove_recording";
  vendorId?: string;
  callId?: number | string;
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

  const action = String(body.action ?? "").trim();
  const vendorId = String(body.vendorId ?? "").trim();
  const callId = Number(body.callId);

  try {
    const supabase = createServiceClient();

    if (
      action === "disable_vendor_calling" ||
      action === "enable_vendor_calling"
    ) {
      if (!vendorId) {
        return NextResponse.json(
          { ok: false, error: "vendorId is required" },
          { status: 400 },
        );
      }

      const { error } = await supabase
        .from("seller_profiles")
        .update({ calling_disabled: action === "disable_vendor_calling" })
        .eq("id", vendorId);

      if (error) throw new Error(error.message);

      return NextResponse.json({ ok: true });
    }

    if (action === "remove_recording") {
      if (!Number.isFinite(callId) || callId <= 0) {
        return NextResponse.json(
          { ok: false, error: "callId is required" },
          { status: 400 },
        );
      }

      const { error } = await supabase
        .from("call_logs")
        .update({ recording_url: null })
        .eq("id", callId);
      if (error) throw new Error(error.message);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to manage communications",
      },
      { status: 500 },
    );
  }
}
