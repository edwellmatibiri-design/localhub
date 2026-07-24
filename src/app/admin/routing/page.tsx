import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Table } from "@/components/ui/Table";
import { ClearEventAction } from "@/components/admin/AdminActions";
import { sb } from "@/lib/supabase/serverClient";

export default async function RoutingPage() {
  async function clearRoutingLog(id: string | number) {
    "use server";
    await sb().from("routing_logs").delete().eq("id", id);
  }

  const { data: routingMetrics } = await sb()
    .from("routing_metrics")
    .select("*")
    .limit(1);
  const metrics = routingMetrics?.[0] || {};

  const { data: routingLogs } = await sb()
    .from("routing_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell
      title="Routing"
      subtitle="Job matching, distance scoring, and availability routing."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Routing Success"
          value={`${((metrics.routing_success ?? 0) * 100).toFixed(1)}%`}
          tone={(metrics.routing_success ?? 0) < 0.9 ? "warning" : "success"}
        />
        <MetricCard
          label="Average Distance"
          value={`${metrics.avg_distance_km ?? 0} km`}
        />
        <MetricCard
          label="Average Response Time"
          value={`${metrics.avg_response_seconds ?? 0}s`}
        />
        <MetricCard
          label="Routing Anomalies"
          value={metrics.anomaly_count ?? 0}
          tone={(metrics.anomaly_count ?? 0) > 0 ? "danger" : "default"}
        />
      </div>

      <Panel>
        <SectionHeader
          title="Routing Logs"
          description="Inspect how jobs are being matched to vendors."
        />
        <Table
          columns={[
            "id",
            "job_id",
            "vendor_id",
            "distance_km",
            "score",
            "status",
            "created_at",
            "actions",
          ]}
          rows={routingLogs || []}
          renderCell={(row, col) => {
            switch (col) {
              case "id":
                return row.id;
              case "job_id":
                return row.job_id;
              case "vendor_id":
                return row.vendor_id;
              case "distance_km":
                return `${row.distance_km} km`;
              case "score":
                return row.score;
              case "status":
                return row.status;
              case "created_at":
                return row.created_at;
              case "actions":
                return (
                  <div className="flex gap-2">
                    <ClearEventAction
                      onClear={clearRoutingLog.bind(null, row.id)}
                    />
                  </div>
                );
              default:
                return "";
            }
          }}
        />
      </Panel>
    </AppShell>
  );
}
