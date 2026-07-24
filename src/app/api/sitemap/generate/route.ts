import { createServiceClient } from "@/lib/db";
import { computePriority } from "@/lib/crawl/computePriority";

const SITE_ORIGIN = "https://localhub.co.za";

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

function computeAgeDays(updatedAt: string | null) {
  if (!updatedAt) return 0;
  const timestamp = Date.parse(updatedAt);
  if (Number.isNaN(timestamp)) return 0;
  const diffMs = Math.max(0, Date.now() - timestamp);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
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

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: generatedPages, error: pagesError } = await supabase
      .from("generated_pages")
      .select("intent_id, internal_links, updated_at");

    if (pagesError) {
      return new Response(JSON.stringify({ error: pagesError.message }), {
        status: 500,
      });
    }

    const pageRows = (generatedPages ?? []) as GeneratedPageRow[];
    if (!pageRows.length) {
      const emptySitemap =
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
      return new Response(emptySitemap, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    const intentIds = pageRows.map((row) => row.intent_id);

    const { data: intentNodes, error: intentError } = await supabase
      .from("intent_nodes")
      .select("id, landing_path")
      .in("id", intentIds);

    if (intentError) {
      return new Response(JSON.stringify({ error: intentError.message }), {
        status: 500,
      });
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
      return new Response(JSON.stringify({ error: freshnessError.message }), {
        status: 500,
      });
    }

    const freshnessByUrl = new Map<string, number>();
    (freshnessRows ?? []).forEach((row) => {
      freshnessByUrl.set(
        normalizeUrl(String(row.page_url ?? "")),
        Number(row.score) || 0,
      );
    });

    const selected = pageRows
      .map((row) => {
        const url = urlByIntentId.get(row.intent_id);
        if (!url) return null;

        const freshness = freshnessByUrl.get(normalizeUrl(url)) ?? 0;
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

        if (priority < 50) {
          return null;
        }

        const lastmod = row.updated_at
          ? new Date(row.updated_at).toISOString()
          : new Date().toISOString();
        return { url, lastmod };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...selected.map(
        (page) =>
          `  <url><loc>${escapeXml(page.url)}</loc><lastmod>${escapeXml(page.lastmod)}</lastmod></url>`,
      ),
      "</urlset>",
    ].join("\n");

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to generate sitemap",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }
}
