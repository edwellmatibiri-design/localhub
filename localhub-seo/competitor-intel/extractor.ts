export type ExtractedCompetitorSignals = {
  title: string | null;
  metaDescription: string | null;
  schemaTypes: string[];
  internalLinks: string[];
};

function matchFirst(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match?.[1] ?? null;
}

export function extractSignals(html: string): ExtractedCompetitorSignals {
  const title = matchFirst(html, /<title>([^<]+)<\/title>/i);
  const metaDescription = matchFirst(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const schemaTypes = [...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  const internalLinks = [...html.matchAll(/<a[^>]*href=["'](\/[^"']*)["']/gi)].map((m) => m[1]);

  return {
    title,
    metaDescription,
    schemaTypes,
    internalLinks,
  };
}
