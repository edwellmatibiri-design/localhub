import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  vendorId?: string;
  name?: string;
  content?: string;
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

  const vendorId = String(body.vendorId ?? "").trim();
  const name = String(body.name ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!vendorId || !name || !content) {
    return NextResponse.json(
      { ok: false, error: "vendorId, name, and content are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("templates")
      .insert({
        vendor_id: vendorId,
        name,
        content,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, templateId: Number(data.id) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to create template",
      },
      { status: 500 },
    );
  }
}
