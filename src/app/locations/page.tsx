import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Browse Service Locations - LocalHub",
  description: "Find trusted local vendors by suburb and city.",
};

export default async function LocationsPage() {
  const supabase = createServiceClient();

  const { data: rows } = await supabase
    .from("seller_profiles")
    .select("suburb_id");

  const suburbIds = Array.from(
    new Set(
      (rows ?? []).map((row) => String(row.suburb_id ?? "")).filter(Boolean),
    ),
  );
  const { data: suburbs } = suburbIds.length
    ? await supabase
        .from("suburbs")
        .select("id, name, slug, city")
        .in("id", suburbIds)
        .order("name", { ascending: true })
    : {
        data: [] as Array<{
          id: string;
          name: string;
          slug: string;
          city: string;
        }>,
      };

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Service Locations</h1>
      {(suburbs ?? []).length === 0 ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No service locations found.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(suburbs ?? []).map((suburb) => (
            <Link
              key={suburb.id}
              href={`/locations/${suburb.slug}`}
              className="card hover:border-lh-accent/40"
            >
              <p className="font-medium">{suburb.name}</p>
              <p className="text-lh-muted mt-1 text-xs">{suburb.city}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
