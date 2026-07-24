import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Body = {
  query?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const query = String(body.query ?? "")
    .trim()
    .toLowerCase();
  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("search_suggestions")
      .select("keyword, type, score")
      .ilike("keyword", `${query}%`)
      .order("score", { ascending: false })
      .limit(12);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ suggestions: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch suggestions",
      },
      { status: 500 },
    );
  }
}
