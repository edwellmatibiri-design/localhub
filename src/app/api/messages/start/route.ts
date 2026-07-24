import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type StartBody = {
  userId?: string;
  vendorId?: string;
};

export async function POST(request: Request) {
  let body: StartBody;
  try {
    body = (await request.json()) as StartBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const userId = String(body.userId ?? "").trim();
  const vendorId = String(body.vendorId ?? "").trim();
  if (!userId || !vendorId) {
    return NextResponse.json(
      { ok: false, error: "userId and vendorId are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId)
      .eq("vendor_id", vendorId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 },
      );
    }

    if (existing?.id) {
      return NextResponse.json({ ok: true, conversationId: existing.id });
    }

    const { data: created, error: createError } = await supabase
      .from("conversations")
      .insert({ user_id: userId, vendor_id: vendorId })
      .select("id")
      .single();

    if (createError) {
      return NextResponse.json(
        { ok: false, error: createError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, conversationId: created.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to start conversation",
      },
      { status: 500 },
    );
  }
}
