import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  flagId?: number | string;
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

  const flagId = Number(body.flagId);
  if (!Number.isFinite(flagId) || flagId <= 0) {
    return NextResponse.json(
      { ok: false, error: "flagId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("quality_flags")
      .update({ resolved: true })
      .eq("id", flagId);

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
          error instanceof Error ? error.message : "Failed to resolve flag",
      },
      { status: 500 },
    );
  }
}
