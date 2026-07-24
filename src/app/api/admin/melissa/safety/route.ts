import { NextResponse } from "next/server";
import {
  getMelissaSafetyRules,
  setMelissaSafetyRule,
} from "@/lib/melissa/safety";

type UpdateBody = {
  actionType?: string;
  enabled?: boolean;
  updatedBy?: string;
};

export async function GET() {
  const rules = await getMelissaSafetyRules();
  return NextResponse.json({ ok: true, rules });
}

export async function POST(request: Request) {
  const body = (await request.json()) as UpdateBody;
  const actionType = String(body.actionType ?? "").trim();

  if (!actionType || typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "actionType and enabled are required" },
      { status: 400 },
    );
  }

  const result = await setMelissaSafetyRule(
    actionType,
    body.enabled,
    String(body.updatedBy ?? "eddie-admin"),
  );
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
