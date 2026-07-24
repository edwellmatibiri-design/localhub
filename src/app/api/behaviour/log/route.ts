import { NextResponse } from "next/server";
import {
  BEHAVIOUR_EVENT_TYPES,
  logBehaviourEvent,
} from "@/lib/behaviour/service";

type Body = {
  userId?: string;
  type?: string;
  metadata?: Record<string, unknown>;
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
  const metadata = body.metadata;

  if (
    !userId ||
    !type ||
    !BEHAVIOUR_EVENT_TYPES.includes(
      type as (typeof BEHAVIOUR_EVENT_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "userId and valid type are required" },
      { status: 400 },
    );
  }

  try {
    const result = await logBehaviourEvent({
      userId,
      type: type as (typeof BEHAVIOUR_EVENT_TYPES)[number],
      metadata,
    });

    return NextResponse.json({
      ok: true,
      leadQualityScore: result.leadQualityScore,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to log behaviour",
      },
      { status: 500 },
    );
  }
}
