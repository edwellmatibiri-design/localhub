import Link from "next/link";
import { createServiceClient } from "@/lib/db";

type SearchParams = {
  category?: string;
  location?: string;
  q?: string;
};

export const dynamic = "force-dynamic";

export default async function GuidesIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const category = String(params.category ?? "")
    .trim()
    .toLowerCase();
  const location = String(params.location ?? "")
    .trim()
    .toLowerCase();
  const q = String(params.q ?? "")
    .trim()
    .toLowerCase();

  const supabase = createServiceClient();
  let query = supabase
    .from("content_guides")
    .select("id, title, slug, summary, category, location, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (category) {
    query = query.eq("category", category);
  }
  if (location) {
    query = query.eq("location", location);
  }
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data: guides } = await query;

  const [categoriesRes, locationsRes] = await Promise.all([
    supabase
      .from("content_guides")
      .select("category")
      .not("category", "is", null)
      .limit(500),
    supabase
      .from("content_guides")
      .select("location")
      .not("location", "is", null)
      .limit(500),
  ]);

  const categories = Array.from(
    new Set(
      (categoriesRes.data ?? [])
        .map((row) => String(row.category))
        .filter(Boolean),
    ),
  ).sort();
  const locations = Array.from(
    new Set(
      (locationsRes.data ?? [])
        .map((row) => String(row.location))
        .filter(Boolean),
    ),
  ).sort();

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Guides</h1>

      <form className="card grid gap-3 md:grid-cols-3" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search guide titles"
          className="border-lh-border rounded-lg border px-3 py-2"
        />
        <select
          name="category"
          defaultValue={category}
          className="border-lh-border rounded-lg border px-3 py-2"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          name="location"
          defaultValue={location}
          className="border-lh-border rounded-lg border px-3 py-2"
        >
          <option value="">All locations</option>
          {locations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm md:col-span-3"
        >
          Apply filters
        </button>
      </form>

      {(guides ?? []).length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No guides found.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(guides ?? []).map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="card hover:border-lh-accent/40"
            >
              <p className="font-medium">{guide.title}</p>
              <p className="text-lh-muted mt-1 text-xs">{guide.summary}</p>
              <p className="text-lh-muted mt-2 text-xs">
                {guide.category ?? "General"}{" "}
                {guide.location ? `| ${guide.location}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
