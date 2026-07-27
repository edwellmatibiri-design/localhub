export type CompileRequest = {
  category: string;
  suburb: string;
  city: string;
};

export type CompiledPath = {
  path: string;
  generatedAtIso: string;
  cacheKey: string;
  revalidateInSeconds: number;
};

const REVALIDATE_24H_SECONDS = 60 * 60 * 24;

export function normaliseSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function compilePath(request: CompileRequest, now = new Date()): CompiledPath {
  const category = normaliseSlug(request.category);
  const suburb = normaliseSlug(request.suburb);
  const city = normaliseSlug(request.city);
  const path = `/${category}/${suburb}`;
  const cacheKey = `landing:${category}:${city}:${suburb}`;

  return {
    path,
    generatedAtIso: now.toISOString(),
    cacheKey,
    revalidateInSeconds: REVALIDATE_24H_SECONDS,
  };
}
