import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("legal_documents")
    .select("slug, version, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data });
}
