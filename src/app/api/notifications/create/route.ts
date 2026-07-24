import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type NotificationBody = {
  userId?: string;
  vendorId?: string;
  type?: string;
  message?: string;
};

export async function POST(request: Request) {
  let body: NotificationBody;
  try {
    body = (await request.json()) as NotificationBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : null;
  const vendorId =
    typeof body.vendorId === "string" ? body.vendorId.trim() : null;
  const type = String(body.type ?? "").trim();
  const message = String(body.message ?? "").trim();

  if ((!userId && !vendorId) || !type || !message) {
    return NextResponse.json(
      {
        ok: false,
        error: "userId or vendorId plus type and message are required",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        vendor_id: vendorId,
        type,
        message,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, notificationId: data.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create notification",
      },
      { status: 500 },
    );
  }
}
