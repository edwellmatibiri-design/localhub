import { callAI } from "@/lib/aiClient";
import { getNearbySuburbs, getRelatedServices } from "@/lib/geo/proximity";
import { buildSchemaStack, buildServiceSchema } from "@/lib/seo/schema";
import { validateSeoCompliance } from "@/lib/seo/compliance";

export type GeneratedPage = {
  title: string;
  metaDescription: string;
  h1: string;
  h2: string[];
  h3: string[];
  intro: string;
  faqs: Array<{ question: string; answer: string }>;
  schemaBlocks: string;
  internalLinks: {
    nearbySuburbs: string[];
    relatedServices: string[];
  };
  quality: {
    uniqueEnough: boolean;
    readable: boolean;
    compliant: boolean;
    reasons: string[];
  };
};

export function generateTitle(
  category: string,
  city: string,
  suburb: string,
): string {
  return `${category} in ${suburb}, ${city} | LocalHub`;
}

export function generateMetaDescription(
  category: string,
  city: string,
  suburb: string,
): string {
  return `Find verified ${category} experts in ${suburb}, ${city}. Compare response times, ratings, and price ranges.`;
}

export function generateHeadingStack(
  category: string,
  city: string,
  suburb: string,
) {
  return {
    h1: `Best ${category} services in ${suburb}`,
    h2: [
      `How to choose a ${category} professional in ${suburb}`,
      `Typical ${category} costs in ${city}`,
      "What makes a provider trustworthy",
    ],
    h3: [
      "Response times and availability",
      "Licensing, insurance, and quality guarantees",
      "Questions to ask before hiring",
    ],
  };
}

export function generateFaqs(category: string, city: string, suburb: string) {
  return [
    {
      question: `How much does ${category} cost in ${suburb}?`,
      answer:
        "Costs vary by scope, urgency, and materials. Request at least three quotes and compare inclusions before booking.",
    },
    {
      question: `Do LocalHub providers serve all of ${city}?`,
      answer:
        "Most providers cover nearby suburbs. Check each listing for service radius and emergency response times.",
    },
  ];
}

export function generateInternalLinkMatrix(category: string, suburb: string) {
  return {
    nearbySuburbs: getNearbySuburbs(suburb).map((item) => item.slug),
    relatedServices: getRelatedServices(category),
  };
}

export function generateSchemaBlocks(
  category: string,
  city: string,
  suburb: string,
): string {
  return buildSchemaStack([
    buildServiceSchema({
      serviceName: category,
      providerName: "LocalHub",
      areaServed: `${suburb}, ${city}`,
    }),
  ]);
}

function simpleReadabilityScore(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const longWords = words.filter((word) => word.length >= 12).length;
  return 1 - longWords / words.length;
}

export async function generateLandingPage(input: {
  category: string;
  city: string;
  suburb: string;
}): Promise<GeneratedPage> {
  const prompt = [
    `Write unique and helpful local service content for ${input.category} in ${input.suburb}, ${input.city}.`,
    "Return plain text with practical buyer guidance, pricing factors, and local trust signals.",
    "Avoid keyword stuffing and avoid duplicate phrasing.",
  ].join("\n");

  const ai = await callAI(prompt);
  const intro = ai.text.slice(0, 900);

  const internalLinks = generateInternalLinkMatrix(
    input.category,
    input.suburb,
  );
  const schemaBlocks = generateSchemaBlocks(
    input.category,
    input.city,
    input.suburb,
  );
  const headingStack = generateHeadingStack(
    input.category,
    input.city,
    input.suburb,
  );

  const compliance = validateSeoCompliance({
    title: generateTitle(input.category, input.city, input.suburb),
    description: generateMetaDescription(
      input.category,
      input.city,
      input.suburb,
    ),
    body: intro,
    keyword: `${input.category} ${input.suburb}`,
    schema: JSON.parse(schemaBlocks),
  });

  const readability = simpleReadabilityScore(intro);

  return {
    title: generateTitle(input.category, input.city, input.suburb),
    metaDescription: generateMetaDescription(
      input.category,
      input.city,
      input.suburb,
    ),
    h1: headingStack.h1,
    h2: headingStack.h2,
    h3: headingStack.h3,
    intro,
    faqs: generateFaqs(input.category, input.city, input.suburb),
    schemaBlocks,
    internalLinks,
    quality: {
      uniqueEnough: intro.length >= 250,
      readable: readability >= 0.82,
      compliant: compliance.pass,
      reasons: compliance.reasons,
    },
  };
}
