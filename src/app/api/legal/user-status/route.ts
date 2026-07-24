import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export async function GET(_req: Request) {
  const supabase = createServiceClient();

  // TODO: Replace with real auth user id
  const userId = "";

  const { data, error } = await supabase
    .from("legal_acceptance")
    .select("document_slug, accepted_version")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accepted: data });
}
