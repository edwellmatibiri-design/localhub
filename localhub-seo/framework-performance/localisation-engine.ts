export type LocalisationInput = {
  serviceCategory: string;
  suburb: string;
  city: string;
  intentKeyword?: string;
};

export type LocalisedPageCopy = {
  title: string;
  metaDescription: string;
  h1: string;
  h2: string;
};

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildLocalisedCopy(input: LocalisationInput): LocalisedPageCopy {
  const category = clean(input.serviceCategory);
  const suburb = clean(input.suburb);
  const city = clean(input.city);
  const keyword = clean(input.intentKeyword ?? `${category} in ${suburb}`);

  return {
    title: `${category} in ${suburb}, ${city} | LocalHub`,
    metaDescription: `Find trusted ${category.toLowerCase()} in ${suburb}, ${city}. ${keyword} with deterministic ranking and verified local providers on LocalHub.`,
    h1: `${category} Services in ${suburb}`,
    h2: `Top ${category} providers in ${suburb}, ${city}`,
  };
}

export function buildCanonicalUrl(baseUrl: string, category: string, suburb: string): string {
  const root = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${root}/${encodeURIComponent(category)}/${encodeURIComponent(suburb)}`;
}
