import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, suburbs } from "@/lib/mockData";
import { generateLandingPage } from "@/lib/ai/pageGenerator";
import { getNearbySuburbs, getRelatedServices } from "@/lib/geo/proximity";
import {
  buildBreadcrumbListSchema,
  buildGeoCircleSchema,
  buildItemListSchema,
  buildLocalBusinessSchema,
  buildOfferCatalogSchema,
  buildReviewSchema,
  buildSchemaStack,
  buildServiceSchema,
} from "@/lib/seo/schema";

export const revalidate = 86400;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhub.co.za";
}

function toCanonical(category: string, city: string, suburb: string): string {
  return `${siteUrl()}/${category}/${city}/${suburb}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; city: string; suburb: string }>;
}): Promise<Metadata> {
  const { category, city, suburb } = await params;
  const canonical = toCanonical(category, city, suburb);
  const title = `${category} services in ${suburb}, ${city} | LocalHub`;
  const description = `Find verified ${category} providers in ${suburb}, ${city}. Compare ratings, response time, and pricing insights.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "LocalHub",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryCitySuburbPage({
  params,
}: {
  params: Promise<{ category: string; city: string; suburb: string }>;
}) {
  const { category, city, suburb } = await params;

  const categoryExists = categories.some((item) => item.slug === category);
  const suburbRecord = suburbs.find(
    (item) =>
      item.slug === suburb &&
      item.city.toLowerCase() === city.replace(/-/g, " ").toLowerCase(),
  );

  if (!categoryExists || !suburbRecord) {
    notFound();
  }

  const generated = await generateLandingPage({ category, city, suburb });
  const nearbySuburbs = getNearbySuburbs(suburb);
  const relatedServices = getRelatedServices(category);
  const canonical = toCanonical(category, city, suburb);

  const schema = buildSchemaStack([
    buildLocalBusinessSchema({
      name: `LocalHub ${category}`,
      url: canonical,
      areaServed: `${suburbRecord.name}, ${suburbRecord.city}`,
      category,
      aggregateRating: { value: 4.6, count: 87 },
    }),
    buildServiceSchema({
      serviceName: category,
      providerName: "LocalHub",
      areaServed: `${suburbRecord.name}, ${suburbRecord.city}`,
    }),
    buildOfferCatalogSchema({
      name: `${category} services in ${suburbRecord.name}`,
      offers: relatedServices.map((service) => ({
        name: service.replace(/-/g, " "),
        url: `${canonical}/${service}`,
      })),
    }),
    buildItemListSchema({
      itemName: `Top ${category} options in ${suburbRecord.name}`,
      items: nearbySuburbs.map((item) => ({
        name: `${category} in ${item.name}`,
        url: `${siteUrl()}/${category}/${item.city.toLowerCase().replace(/\s+/g, "-")}/${item.slug}`,
      })),
    }),
    buildReviewSchema({
      author: "LocalHub Customer",
      rating: 5,
      reviewBody: "Fast response and transparent pricing.",
      datePublished: new Date().toISOString(),
    }),
    buildBreadcrumbListSchema({
      items: [
        { name: "Home", item: siteUrl() },
        { name: category, item: `${siteUrl()}/${category}` },
        { name: city, item: `${siteUrl()}/${category}/${city}` },
        { name: suburbRecord.name, item: canonical },
      ],
    }),
    buildGeoCircleSchema({
      latitude: -26.104,
      longitude: 28.058,
      radiusMeters: 8000,
    }),
  ]);

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{generated.h1}</h1>
        <p className="text-lh-muted">{generated.metaDescription}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Local Overview</h2>
        <p>{generated.intro}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Nearby Suburbs</h2>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {nearbySuburbs.map((item) => (
            <Link
              key={item.slug}
              href={`/${category}/${item.city.toLowerCase().replace(/\s+/g, "-")}/${item.slug}`}
              className="card text-sm"
            >
              {item.name} ({item.distanceKm} km)
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Related Services</h2>
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {relatedServices.map((service) => (
            <li key={service}>
              <Link
                href={`/${category}/${city}/${suburb}/${service}`}
                className="card block text-sm"
              >
                {service.replace(/-/g, " ")}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">FAQ</h2>
        {generated.faqs.map((faq) => (
          <div className="card" key={faq.question}>
            <h3 className="font-semibold">{faq.question}</h3>
            <p className="text-lh-muted mt-1 text-sm">{faq.answer}</p>
          </div>
        ))}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schema }}
      />
    </article>
  );
}
