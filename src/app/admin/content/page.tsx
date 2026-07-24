import { createServiceClient } from "@/lib/db";
import ContentAdminClient from "@/components/admin/ContentAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("content_guides")
    .select("id, title, category, location, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin Content Dashboard</h1>
      <ContentAdminClient
        guides={
          (data ?? []) as Array<{
            id: number;
            title: string;
            category: string | null;
            location: string | null;
            updated_at: string;
          }>
        }
      />
    </section>
  );
}
