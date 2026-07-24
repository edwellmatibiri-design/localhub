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

function toPath(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname || "/";
  } catch {
    return "/";
  }
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
      const fallback = [
        "User-agent: *",
        "Disallow:",
        "Sitemap: https://localhub.co.za/sitemap.xml",
      ].join("\n");
      return new Response(fallback, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
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

    const allow = new Set<string>();
    const disallow = new Set<string>();

    pageRows.forEach((row) => {
      const url = urlByIntentId.get(row.intent_id);
      if (!url) return;

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
      const path = toPath(url);

      if (priority >= 50) {
        allow.add(path);
      }

      if (priority < 20) {
        disallow.add(path);
      }
    });

    const lines = ["User-agent: *"];
    Array.from(allow)
      .sort()
      .forEach((path) => lines.push(`Allow: ${path}`));
    Array.from(disallow)
      .sort()
      .forEach((path) => lines.push(`Disallow: ${path}`));
    lines.push("Sitemap: https://localhub.co.za/sitemap.xml");

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to generate robots.txt",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }
}
