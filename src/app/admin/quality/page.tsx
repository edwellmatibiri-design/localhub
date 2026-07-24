import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Table } from "@/components/ui/Table";
import { FlagAction } from "@/components/admin/AdminActions";
import { sb } from "@/lib/supabase/serverClient";

export default async function QualityPage() {
  async function flagCategory(id: string | number, reason: string) {
    "use server";
    await sb()
      .from("category_quality")
      .update({ flagged: true, flag_reason: reason })
      .eq("id", id);
  }

  const { data: quality } = await sb()
    .from("quality_metrics")
    .select("*")
    .limit(1);
  const qualityRow = quality?.[0] || {};

  const { data: categories } = await sb()
    .from("category_quality")
    .select("*")
    .limit(50);

  return (
    <AppShell
      title="Quality"
      subtitle="Completion, cancellations, quote accuracy, and ranking health."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Completion Rate"
          value={`${((qualityRow.completion_rate ?? 0) * 100).toFixed(1)}%`}
          tone={(qualityRow.completion_rate ?? 0) < 0.9 ? "warning" : "success"}
        />
        <MetricCard
          label="Cancellation Rate"
          value={`${((qualityRow.cancellation_rate ?? 0) * 100).toFixed(1)}%`}
          tone={
            (qualityRow.cancellation_rate ?? 0) > 0.1 ? "danger" : "default"
          }
        />
        <MetricCard
          label="Quote Accuracy"
          value={`${((qualityRow.quote_accuracy ?? 0) * 100).toFixed(1)}%`}
          tone={(qualityRow.quote_accuracy ?? 0) < 0.85 ? "warning" : "success"}
        />
        <MetricCard
          label="Ranking Health"
          value={qualityRow.ranking_health ?? "-"}
          tone={(qualityRow.ranking_health ?? 0) > 70 ? "success" : "warning"}
        />
      </div>

      <Panel>
        <SectionHeader
          title="Category Quality"
          description="Quality metrics broken down by category."
        />
        <Table
          columns={[
            "category",
            "completion_rate",
            "cancellation_rate",
            "quote_accuracy",
            "actions",
          ]}
          rows={categories || []}
          renderCell={(row, col) => {
            switch (col) {
              case "category":
                return row.category_name || row.category;
              case "completion_rate":
                return `${(Number(row.completion_rate ?? 0) * 100).toFixed(1)}%`;
              case "cancellation_rate":
                return `${(Number(row.cancellation_rate ?? 0) * 100).toFixed(1)}%`;
              case "quote_accuracy":
                return `${(Number(row.quote_accuracy ?? 0) * 100).toFixed(1)}%`;
              case "actions":
                return (
                  <div className="flex gap-2">
                    <FlagAction onFlag={flagCategory.bind(null, row.id)} />
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
