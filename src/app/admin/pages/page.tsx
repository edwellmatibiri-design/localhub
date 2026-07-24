import { createServiceClient } from "@/lib/db";
import AdminGeneratedPagesClient from "@/components/admin/AdminGeneratedPagesClient";

export const dynamic = "force-dynamic";

export default async function AdminGeneratedPagesPage() {
  const supabase = createServiceClient();
  const { data: pages } = await supabase
    .from("generated_pages")
    .select(
      "intent_id, title, updated_at, meta_description, h1, h2, h3, faqs, schema, internal_links",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  return <AdminGeneratedPagesClient pages={pages ?? []} />;
}
