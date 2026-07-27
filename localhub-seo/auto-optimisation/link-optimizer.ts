export type LinkBlock = {
  suburb: string;
  href: string;
  relevanceScore: number;
};

export function optimiseLinkMatrix(links: LinkBlock[], maxLinks = 24): LinkBlock[] {
  return [...links]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxLinks);
}
