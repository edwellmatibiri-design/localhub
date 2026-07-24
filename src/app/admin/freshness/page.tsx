import { createServiceClient } from "@/lib/db";
import FreshnessActions from "@/components/admin/FreshnessActions";
import FreshnessProbe from "@/components/admin/FreshnessProbe";

export const dynamic = "force-dynamic";

export default async function AdminFreshnessPage() {
  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from("freshness_scores")
    .select("page_url, score, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Freshness</h2>
        <FreshnessActions />
      </div>

      <div className="border-lh-border overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-lh-surface-soft text-lh-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Page URL</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr key={row.page_url} className="border-lh-border border-t">
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {row.page_url}
                </td>
                <td className="px-3 py-2">{row.score}</td>
                <td className="text-lh-muted px-3 py-2 text-xs">
                  {new Date(row.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(rows ?? [])[0]?.page_url && (
        <FreshnessProbe url={(rows ?? [])[0].page_url} />
      )}
    </div>
  );
}
