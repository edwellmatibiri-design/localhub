import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  token?: string;
  password?: string;
};

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

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

  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "").trim();

  if (!token || password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "token and password (min 8 chars) are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const passwordHash = hashPassword(password);

    const { error } = await supabase
      .from("staff")
      .update({
        password_hash: passwordHash,
        is_active: true,
        invite_token: null,
        last_activity: new Date().toISOString(),
      })
      .eq("invite_token", token)
      .is("disabled_at", null);

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
            : "Failed to accept invitation",
      },
      { status: 500 },
    );
  }
}
