export type JsonLdObject = Record<string, unknown>;

export type SchemaInput = {
  businessName: string;
  pageUrl: string;
  category: string;
  city: string;
  suburb: string;
  aggregateRating?: { ratingValue: number; reviewCount: number };
};

export function buildLocalBusinessSchema(input: SchemaInput): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.businessName,
    url: input.pageUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: input.suburb,
      addressRegion: input.city,
      addressCountry: "ZA",
    },
    areaServed: `${input.suburb}, ${input.city}`,
  };
}

export function buildBreadcrumbSchema(input: SchemaInput): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://localhub.co.za/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: input.category,
        item: `https://localhub.co.za/${encodeURIComponent(input.category.toLowerCase())}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: input.suburb,
        item: input.pageUrl,
      },
    ],
  };
}

export function serialiseJsonLd(schema: JsonLdObject): string {
  return JSON.stringify(schema);
}
