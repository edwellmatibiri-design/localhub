export type MetaInput = {
  category: string;
  suburb: string;
  city: string;
  topBenefit: string;
};

export type MetaOutput = {
  title: string;
  description: string;
  h1: string;
};

export function rewriteMeta(input: MetaInput): MetaOutput {
  const title = `${input.category} in ${input.suburb}, ${input.city} | LocalHub`;
  const description = `${input.topBenefit}. Discover trusted ${input.category.toLowerCase()} providers in ${input.suburb}, ${input.city} on LocalHub.`;
  const h1 = `Top ${input.category} in ${input.suburb}`;

  return { title, description, h1 };
}
