export type LinkNode = {
  suburb: string;
  url: string;
};

export function buildFlatLinkMatrix(currentSuburb: string, nearbySuburbs: string[], basePath: string): LinkNode[] {
  const unique = [...new Set(nearbySuburbs.filter((suburb) => suburb !== currentSuburb))];
  const root = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

  return unique.map((suburb) => ({
    suburb,
    url: `${root}/${encodeURIComponent(suburb.toLowerCase().replace(/\s+/g, "-"))}`,
  }));
}

export function isWithinThreeClicks(depth: number): boolean {
  return depth <= 3;
}
