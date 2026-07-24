import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type MarkReadBody = {
  notificationId?: number | string;
};

export async function POST(request: Request) {
  let body: MarkReadBody;
  try {
    body = (await request.json()) as MarkReadBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const notificationId = Number(body.notificationId);
  if (!Number.isFinite(notificationId) || notificationId <= 0) {
    return NextResponse.json(
      { ok: false, error: "notificationId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to mark notification as read",
      },
      { status: 500 },
    );
  }
}
