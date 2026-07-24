export type SchemaNode = Record<string, unknown>;

type BusinessSchemaInput = {
  name: string;
  url: string;
  telephone?: string;
  areaServed: string;
  category: string;
  aggregateRating?: {
    value: number;
    count: number;
  };
};

type ServiceSchemaInput = {
  serviceName: string;
  providerName: string;
  areaServed: string;
};

type OfferCatalogInput = {
  name: string;
  offers: Array<{ name: string; price?: number; url: string }>;
};

type ItemListInput = {
  itemName: string;
  items: Array<{ name: string; url: string }>;
};

type ReviewSchemaInput = {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
};

type BreadcrumbInput = {
  items: Array<{ name: string; item: string }>;
};

type GeoCircleInput = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export function buildLocalBusinessSchema(
  input: BusinessSchemaInput,
): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    url: input.url,
    telephone: input.telephone,
    areaServed: input.areaServed,
    knowsAbout: input.category,
    aggregateRating: input.aggregateRating
      ? {
          "@type": "AggregateRating",
          ratingValue: input.aggregateRating.value,
          reviewCount: input.aggregateRating.count,
        }
      : undefined,
  };
}

export function buildServiceSchema(input: ServiceSchemaInput): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: input.serviceName,
    provider: {
      "@type": "Organization",
      name: input.providerName,
    },
    areaServed: input.areaServed,
  };
}

export function buildOfferCatalogSchema(input: OfferCatalogInput): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: input.name,
    itemListElement: input.offers.map((offer) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: offer.name,
      },
      price: offer.price,
      priceCurrency: "ZAR",
      url: offer.url,
    })),
  };
}

export function buildItemListSchema(input: ItemListInput): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.itemName,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function buildReviewSchema(input: ReviewSchemaInput): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: input.author,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: input.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: input.reviewBody,
    datePublished: input.datePublished,
  };
}

export function buildBreadcrumbListSchema(input: BreadcrumbInput): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: input.items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}

export function buildGeoCircleSchema(input: GeoCircleInput): SchemaNode {
  return {
    "@context": "https://schema.org",
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    },
    geoRadius: input.radiusMeters,
  };
}

export function buildSchemaStack(nodes: SchemaNode[]): string {
  return JSON.stringify(nodes.filter(Boolean));
}
