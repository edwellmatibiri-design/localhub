import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = { guideId?: number | string };

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

  const guideId = Number(body.guideId);
  if (!Number.isFinite(guideId) || guideId <= 0) {
    return NextResponse.json(
      { ok: false, error: "guideId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("content_guides")
      .delete()
      .eq("id", guideId);
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
          error instanceof Error ? error.message : "Failed to delete guide",
      },
      { status: 500 },
    );
  }
}
