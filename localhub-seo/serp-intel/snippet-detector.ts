export type SnippetFlags = {
  hasReviews: boolean;
  hasFaq: boolean;
  hasSitelinks: boolean;
  hasPrice: boolean;
};

export function detectSnippetFeatures(html: string): SnippetFlags {
  const source = html.toLowerCase();
  return {
    hasReviews: source.includes("rating") || source.includes("review"),
    hasFaq: source.includes("faq") || source.includes("q&a"),
    hasSitelinks: source.includes("sitelinks") || source.includes("jump to"),
    hasPrice: source.includes("price") || source.includes("zar") || source.includes("r "),
  };
}
