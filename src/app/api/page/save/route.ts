import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

type Faq = {
  question: string;
  answer: string;
};

type SaveBody = {
  intentId?: string;
  title?: string;
  metaDescription?: string;
  h1?: string;
  h2?: string[];
  h3?: string[];
  faqs?: Faq[];
  schema?: Record<string, unknown>;
  internalLinks?: string[];
};

export async function POST(request: Request) {
  let body: SaveBody;
  try {
    body = (await request.json()) as SaveBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const intentId = String(body.intentId ?? "").trim();
  const title = String(body.title ?? "").trim();
  const metaDescription = String(body.metaDescription ?? "").trim();
  const h1 = String(body.h1 ?? "").trim();
  const h2 = Array.isArray(body.h2)
    ? body.h2.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const h3 = Array.isArray(body.h3)
    ? body.h3.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const faqs = Array.isArray(body.faqs)
    ? body.faqs
        .map((item) => ({
          question: String(item?.question ?? "").trim(),
          answer: String(item?.answer ?? "").trim(),
        }))
        .filter((item) => item.question && item.answer)
    : [];
  const schema =
    body.schema && typeof body.schema === "object" ? body.schema : {};
  const internalLinks = Array.isArray(body.internalLinks)
    ? body.internalLinks.map((item) => String(item).trim()).filter(Boolean)
    : [];

  if (
    !intentId ||
    !title ||
    !metaDescription ||
    !h1 ||
    !h2.length ||
    !h3.length ||
    !faqs.length
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing required generated page fields",
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("generated_pages").upsert(
      {
        intent_id: intentId,
        title,
        meta_description: metaDescription,
        h1,
        h2,
        h3,
        faqs,
        schema,
        internal_links: internalLinks,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "intent_id" },
    );

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, intentId });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to save generated page",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
