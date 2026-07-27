export type SerpResult = {
  position: number;
  title: string;
  url: string;
  hasRichSnippet: boolean;
};

export type SerpSnapshot = {
  keyword: string;
  locale: string;
  capturedAtIso: string;
  results: SerpResult[];
};

export function createSerpSnapshot(keyword: string, locale: string, results: SerpResult[], capturedAt = new Date()): SerpSnapshot {
  return {
    keyword,
    locale,
    capturedAtIso: capturedAt.toISOString(),
    results: [...results].sort((a, b) => a.position - b.position),
  };
}
