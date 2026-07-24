import { detectMicroIntent } from "@/lib/intent/graph";

export type MicroPageCandidate = {
  intent: string;
  keyword: string;
  path: string;
  score: number;
};

const MIN_INTENT_SCORE = 0.7;

export function generateMicroPages(input: {
  category: string;
  city: string;
  suburb: string;
  keywords: string[];
}): MicroPageCandidate[] {
  const seen = new Set<string>();

  return input.keywords
    .map((keyword) => {
      const intent = detectMicroIntent(keyword);
      if (!intent) return null;

      const score = keyword.toLowerCase().includes(input.suburb.toLowerCase())
        ? 0.9
        : 0.72;
      if (score < MIN_INTENT_SCORE) return null;

      const path = `/${input.category}/${input.city}/${input.suburb}/${intent}`;
      if (seen.has(path)) return null;
      seen.add(path);

      return {
        intent,
        keyword,
        path,
        score,
      } satisfies MicroPageCandidate;
    })
    .filter((item): item is MicroPageCandidate => Boolean(item));
}
