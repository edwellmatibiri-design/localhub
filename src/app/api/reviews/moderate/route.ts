import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type ModerateBody = {
  reviewId?: number | string;
  action?: "approve" | "reject" | "flag";
};

export async function POST(request: Request) {
  let body: ModerateBody;
  try {
    body = (await request.json()) as ModerateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const reviewId = Number(body.reviewId);
  const action = String(body.action ?? "").trim();

  if (
    !Number.isFinite(reviewId) ||
    reviewId <= 0 ||
    !["approve", "reject", "flag"].includes(action)
  ) {
    return NextResponse.json(
      { ok: false, error: "reviewId and valid action are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const verified = action === "approve";

    const { error } = await supabase
      .from("reviews")
      .update({ verified })
      .eq("id", reviewId);

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
          error instanceof Error ? error.message : "Failed to moderate review",
      },
      { status: 500 },
    );
  }
}
