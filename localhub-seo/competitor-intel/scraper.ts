export type Fetcher = (url: string) => Promise<string>;

export type CompetitorPage = {
  url: string;
  html: string;
  fetchedAtIso: string;
};

export async function scrapeCompetitorPages(urls: string[], fetcher: Fetcher): Promise<CompetitorPage[]> {
  const pages = await Promise.all(
    urls.map(async (url) => {
      const html = await fetcher(url);
      return {
        url,
        html,
        fetchedAtIso: new Date().toISOString(),
      };
    }),
  );
  return pages;
}
