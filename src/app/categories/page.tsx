import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Browse Service Categories - LocalHub",
  description: "Explore local service categories and discover top vendors.",
};

export default async function CategoriesPage() {
  const supabase = createServiceClient();

  const { data: rows } = await supabase
    .from("seller_profiles")
    .select("category_id");

  const categoryIds = Array.from(
    new Set(
      (rows ?? []).map((row) => String(row.category_id ?? "")).filter(Boolean),
    ),
  );
  const { data: categories } = categoryIds.length
    ? await supabase
        .from("categories")
        .select("id, name, slug")
        .in("id", categoryIds)
        .order("name", { ascending: true })
    : { data: [] as Array<{ id: string; name: string; slug: string }> };

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Service Categories</h1>
      {(categories ?? []).length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No categories found.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? []).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="card hover:border-lh-accent/40"
            >
              <p className="font-medium">{category.name}</p>
              <p className="text-lh-muted mt-1 text-xs">
                View top vendors and listings
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
