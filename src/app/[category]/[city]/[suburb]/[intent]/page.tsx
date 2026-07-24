import type { Metadata } from "next";
import Link from "next/link";
import { generateMicroPages } from "@/lib/ai/microPages";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhub.co.za";
}

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    category: string;
    city: string;
    suburb: string;
    intent: string;
  }>;
}): Promise<Metadata> {
  const { category, city, suburb, intent } = await params;
  const canonical = `${siteUrl()}/${category}/${city}/${suburb}`;
  const path = `${canonical}/${intent}`;
  const title = `${category} ${suburb} ${intent} | LocalHub`;
  const description = `Intent-focused guidance for ${category} in ${suburb}.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: path,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function IntentPage({
  params,
}: {
  params: Promise<{
    category: string;
    city: string;
    suburb: string;
    intent: string;
  }>;
}) {
  const { category, city, suburb, intent } = await params;

  const pages = generateMicroPages({
    category,
    city,
    suburb,
    keywords: [
      `${category} ${suburb} price`,
      `${category} ${suburb} emergency`,
      `${category} ${suburb} best rated`,
    ],
  });

  const matches = pages.filter((page) => page.intent === intent);

  return (
    <article className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold">
          {category} in {suburb}: {intent}
        </h1>
        <p className="text-lh-muted">
          This micro-landing page exists only for verified user intent signals.
        </p>
      </header>

      <section className="space-y-2">
        {matches.length === 0 ? (
          <p>No strong intent signal detected for this page.</p>
        ) : (
          matches.map((match) => (
            <div key={match.path} className="card">
              <h2 className="font-semibold">Intent keyword: {match.keyword}</h2>
              <p className="text-lh-muted text-sm">
                Intent confidence: {match.score}
              </p>
            </div>
          ))
        )}
      </section>

      <Link
        href={`/${category}/${city}/${suburb}`}
        className="card inline-block text-sm"
      >
        Back to main suburb page
      </Link>
    </article>
  );
}
