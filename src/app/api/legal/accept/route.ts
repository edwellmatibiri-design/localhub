import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type AcceptBody = {
  document_slug?: string;
  version?: string;
};

export async function POST(req: Request) {
  const supabase = createServiceClient();
  const body = (await req.json()) as AcceptBody;
  const { document_slug, version } = body;

  if (!document_slug || !version) {
    return NextResponse.json(
      { error: "document_slug and version are required" },
      { status: 400 },
    );
  }

  // TODO: Replace with real auth user id
  const userId = "";

  const { error } = await supabase.from("legal_acceptance").upsert({
    user_id: userId,
    document_slug,
    accepted_version: version,
    accepted_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
