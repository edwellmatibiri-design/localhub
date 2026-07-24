import { createServiceClient } from "@/lib/db";
import AdminIntentsClient from "@/components/admin/AdminIntentsClient";

export const dynamic = "force-dynamic";

export default async function AdminIntentsPage() {
  const supabase = createServiceClient();
  const { data: intents } = await supabase
    .from("intent_nodes")
    .select("id, keyword, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return <AdminIntentsClient intents={intents ?? []} />;
}
