import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/db";

type Params = { slug: string };

type GuideRow = {
  id: number;
  intent_id: number | null;
  category: string | null;
  location: string | null;
  title: string;
  slug: string;
  summary: string;
  content: {
    sections?: Array<{ heading?: string; body?: string }>;
    tags?: string[];
  };
};

async function loadGuide(slug: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("content_guides")
    .select("id, intent_id, category, location, title, slug, summary, content")
    .eq("slug", slug)
    .maybeSingle();

  return (data as GuideRow | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await loadGuide(slug);
  if (!guide) {
    return { title: "Guide - LocalHub", description: "LocalHub service guide" };
  }

  return {
    title: guide.title,
    description: guide.summary,
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const guide = await loadGuide(slug);
  if (!guide) {
    notFound();
  }

  const supabase = createServiceClient();

  const guideFilter = [
    guide.category ? `category.eq.${guide.category}` : "",
    guide.location ? `location.eq.${guide.location}` : "",
  ]
    .filter(Boolean)
    .join(",");

  let relatedGuidesQuery = supabase
    .from("content_guides")
    .select("id, title, slug")
    .neq("id", guide.id)
    .order("updated_at", { ascending: false })
    .limit(6);

  if (guideFilter) {
    relatedGuidesQuery = relatedGuidesQuery.or(guideFilter);
  }

  const intentFilter = [
    guide.category ? `keyword.ilike.%${guide.category}%` : "",
    guide.location ? `keyword.ilike.%${guide.location}%` : "",
  ]
    .filter(Boolean)
    .join(",");

  let relatedIntentsQuery = supabase
    .from("intent_nodes")
    .select("id, keyword, landing_path")
    .limit(8);

  if (intentFilter) {
    relatedIntentsQuery = relatedIntentsQuery.or(intentFilter);
  } else {
    relatedIntentsQuery = relatedIntentsQuery.order("score", {
      ascending: false,
    });
  }

  const [
    { data: relatedGuides },
    { data: relatedIntents },
    { data: categories },
    { data: suburbs },
  ] = await Promise.all([
    relatedGuidesQuery,
    relatedIntentsQuery,
    supabase.from("categories").select("id, name, slug"),
    supabase.from("suburbs").select("id, name, slug"),
  ]);

  const categoryId = (categories ?? []).find(
    (row) =>
      String(row.slug) === String(guide.category ?? "") ||
      String(row.name).toLowerCase() ===
        String(guide.category ?? "").toLowerCase(),
  )?.id;
  const suburbId = (suburbs ?? []).find(
    (row) =>
      String(row.slug) === String(guide.location ?? "") ||
      String(row.name).toLowerCase() ===
        String(guide.location ?? "").toLowerCase(),
  )?.id;

  const { data: relatedVendors } = await supabase
    .from("seller_profiles")
    .select("id, business_name")
    .match({
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(suburbId ? { suburb_id: suburbId } : {}),
    })
    .limit(6);

  const vendorIds = (relatedVendors ?? []).map((row) => String(row.id));
  const { data: relatedListings } = vendorIds.length
    ? await supabase
        .from("listings")
        .select("id, title, seller_id")
        .in("seller_id", vendorIds)
        .eq("is_active", true)
        .limit(8)
    : { data: [] as Array<{ id: string; title: string; seller_id: string }> };

  const sections = Array.isArray(guide.content?.sections)
    ? guide.content.sections
    : [];

  return (
    <section className="shell space-y-4 p-6">
      <header className="card space-y-2">
        <h1 className="text-3xl font-semibold">{guide.title}</h1>
        <p className="text-lh-muted text-sm">{guide.summary}</p>
        <div className="text-lh-muted flex flex-wrap gap-2 text-xs">
          {guide.category && (
            <Link
              href={`/categories/${encodeURIComponent(guide.category)}`}
              className="hover:underline"
            >
              Category: {guide.category}
            </Link>
          )}
          {guide.location && (
            <Link
              href={`/locations/${encodeURIComponent(guide.location)}`}
              className="hover:underline"
            >
              Location: {guide.location}
            </Link>
          )}
        </div>
      </header>

      <article className="card space-y-4">
        {sections.map((section, index) => (
          <section key={`${section.heading}-${index}`} className="space-y-1">
            <h2 className="text-xl font-semibold">
              {section.heading ?? `Section ${index + 1}`}
            </h2>
            <p className="text-lh-muted text-sm">{section.body ?? ""}</p>
          </section>
        ))}
      </article>

      <section className="card space-y-2">
        <h3 className="text-lg font-semibold">Related Guides</h3>
        {(relatedGuides ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No related guides yet.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {(relatedGuides ?? []).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/guides/${item.slug}`}
                  className="text-lh-accent text-sm hover:underline"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-2">
        <h3 className="text-lg font-semibold">Related Intents</h3>
        {(relatedIntents ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No related intents yet.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {(relatedIntents ?? []).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/search?keyword=${encodeURIComponent(String(item.keyword))}`}
                  className="text-lh-accent text-sm hover:underline"
                >
                  {item.keyword}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-2">
        <h3 className="text-lg font-semibold">Related Vendors</h3>
        {(relatedVendors ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No related vendors yet.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {(relatedVendors ?? []).map((vendor) => (
              <li key={vendor.id}>
                <Link
                  href={`/vendors/${vendor.id}`}
                  className="text-lh-accent text-sm hover:underline"
                >
                  {vendor.business_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-2">
        <h3 className="text-lg font-semibold">Related Listings</h3>
        {(relatedListings ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No related listings yet.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {(relatedListings ?? []).map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="text-lh-accent text-sm hover:underline"
                >
                  {listing.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
