import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("categories")
      .select("name, slug")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, categories: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to load categories",
      },
      { status: 500 },
    );
  }
}
