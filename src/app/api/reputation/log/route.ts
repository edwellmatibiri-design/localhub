import { NextResponse } from "next/server";
import {
  REPUTATION_EVENT_TYPES,
  logReputationEvent,
} from "@/lib/reputation/service";

type Body = {
  userId?: string;
  type?: string;
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

  const userId = String(body.userId ?? "").trim();
  const type = String(body.type ?? "").trim();

  if (
    !userId ||
    !type ||
    !REPUTATION_EVENT_TYPES.includes(
      type as (typeof REPUTATION_EVENT_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "userId and valid type are required" },
      { status: 400 },
    );
  }

  try {
    const result = await logReputationEvent({
      userId,
      type: type as (typeof REPUTATION_EVENT_TYPES)[number],
    });

    return NextResponse.json({
      ok: true,
      reputationScore: result.reputationScore,
      tier: result.tier,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to log reputation event",
      },
      { status: 500 },
    );
  }
}
