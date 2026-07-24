import type { FreshnessDecision } from "@/lib/seo/freshness";

type RevalidateFn = (path: string) => void;

export function buildCategoryCitySuburbPath(
  category: string,
  city: string,
  suburb: string,
): string {
  return `/${category}/${city}/${suburb}`;
}

export function buildMicroIntentPaths(
  category: string,
  city: string,
  suburb: string,
): string[] {
  const intents = ["price", "emergency", "best-rated"];
  return intents.map((intent) => `/${category}/${city}/${suburb}/${intent}`);
}

export function revalidateCategoryAndIntentPages(
  input: { category: string; city: string; suburb: string },
  revalidatePath: RevalidateFn,
) {
  const main = buildCategoryCitySuburbPath(
    input.category,
    input.city,
    input.suburb,
  );
  const micro = buildMicroIntentPaths(input.category, input.city, input.suburb);

  [main, ...micro].forEach((path) => revalidatePath(path));
}

export function revalidateFreshnessDecision(
  decision: FreshnessDecision,
  revalidatePath: RevalidateFn,
) {
  const all = new Set<string>([...decision.revalidate]);
  all.forEach((path) => {
    revalidatePath(path);
  });
}
