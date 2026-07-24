import { NextResponse } from "next/server";
import {
  startOutreachOnboarding,
  syncOutreachOnboardingCompletion,
} from "@/lib/outreach/onboarding";

type Body = {
  businessId?: number | string;
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

  const businessId = Number(body.businessId);
  if (!Number.isFinite(businessId) || businessId <= 0) {
    return NextResponse.json(
      { ok: false, error: "businessId is required" },
      { status: 400 },
    );
  }

  try {
    const onboarding = await startOutreachOnboarding(businessId);
    const completion = await syncOutreachOnboardingCompletion(businessId);
    return NextResponse.json({ ok: true, onboarding, completion });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to start onboarding",
      },
      { status: 500 },
    );
  }
}
