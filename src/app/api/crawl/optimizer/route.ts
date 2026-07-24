import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { computePriority } from "@/lib/crawl/computePriority";

const SITE_ORIGIN = "https://localhub.co.za";

type Body = {
  limit?: number;
};

type GeneratedPageRow = {
  intent_id: string;
  internal_links: unknown;
  updated_at: string | null;
};

function toAbsoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${normalizedPath}`;
}

function normalizeUrl(url: string) {
  return url.replace(/\/$/, "");
}

function parseOptionalBody(raw: string): Body {
  if (!raw.trim()) {
    return {};
  }

  return JSON.parse(raw) as Body;
}

function hashText(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function mockImpressions(url: string) {
  return 50 + (hashText(url) % 12001);
}

function computeAgeDays(updatedAt: string | null) {
  if (!updatedAt) return 0;
  const timestamp = Date.parse(updatedAt);
  if (Number.isNaN(timestamp)) return 0;
  const diffMs = Math.max(0, Date.now() - timestamp);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export async function POST(request: Request) {
  let body: Body;
  try {
    const raw = await request.text();
    body = parseOptionalBody(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const limit = body.limit;
  if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
    return NextResponse.json(
      { error: "limit must be a positive integer" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServiceClient();

    const { data: generatedPages, error: pagesError } = await supabase
      .from("generated_pages")
      .select("intent_id, internal_links, updated_at");

    if (pagesError) {
      return NextResponse.json({ error: pagesError.message }, { status: 500 });
    }

    const pageRows = (generatedPages ?? []) as GeneratedPageRow[];
    if (!pageRows.length) {
      return NextResponse.json({ pages: [] });
    }

    const intentIds = pageRows.map((row) => row.intent_id);

    const { data: intentNodes, error: intentError } = await supabase
      .from("intent_nodes")
      .select("id, landing_path")
      .in("id", intentIds);

    if (intentError) {
      return NextResponse.json({ error: intentError.message }, { status: 500 });
    }

    const urlByIntentId = new Map<string, string>();
    (intentNodes ?? []).forEach((node) => {
      const id = String(node.id ?? "");
      const landingPath = String(node.landing_path ?? "").trim();
      if (id && landingPath) {
        urlByIntentId.set(id, toAbsoluteUrl(landingPath));
      }
    });

    const urls = pageRows
      .map((row) => urlByIntentId.get(row.intent_id))
      .filter((url): url is string => Boolean(url));

    const { data: freshnessRows, error: freshnessError } = await supabase
      .from("freshness_scores")
      .select("page_url, score")
      .in("page_url", urls);

    if (freshnessError) {
      return NextResponse.json(
        { error: freshnessError.message },
        { status: 500 },
      );
    }

    const freshnessByUrl = new Map<string, number>();
    (freshnessRows ?? []).forEach((row) => {
      freshnessByUrl.set(
        normalizeUrl(String(row.page_url ?? "")),
        Number(row.score) || 0,
      );
    });

    const pages = pageRows
      .map((row) => {
        const url = urlByIntentId.get(row.intent_id);
        if (!url) return null;

        const normalizedUrl = normalizeUrl(url);
        const freshness = freshnessByUrl.get(normalizedUrl) ?? 0;
        const ageDays = computeAgeDays(row.updated_at);
        const internalLinks = Array.isArray(row.internal_links)
          ? row.internal_links.length
          : 0;
        const impressions = mockImpressions(url);
        const priority = computePriority({
          freshness,
          ageDays,
          internalLinks,
          impressions,
        });

        return {
          url,
          priority,
          freshness,
          ageDays,
          internalLinks,
          impressions,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.priority - a.priority);

    return NextResponse.json({
      pages: typeof limit === "number" ? pages.slice(0, limit) : pages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to optimize crawl budget",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
