import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { ApproveRejectActions } from "@/components/admin/AdminActions";
import { sb } from "@/lib/supabase/serverClient";

export default async function ReviewsPage() {
  async function approveReview(id: string | number) {
    "use server";
    await sb().from("reviews").update({ status: "approved" }).eq("id", id);
  }

  async function rejectReview(id: string | number) {
    "use server";
    await sb().from("reviews").update({ status: "rejected" }).eq("id", id);
  }

  const { data: reviews } = await sb()
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const total = reviews?.length ?? 0;
  const avgRating =
    total > 0
      ? reviews!.reduce(
          (sum, review) => sum + (Number(review.rating) || 0),
          0,
        ) / total
      : 0;
  const negative =
    reviews?.filter((review) => Number(review.rating) <= 2).length ?? 0;

  return (
    <AppShell
      title="Reviews"
      subtitle="User and vendor feedback, quality signals, and moderation."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Total Reviews" value={total} />
        <MetricCard
          label="Average Rating"
          value={avgRating.toFixed(2)}
          tone={avgRating < 3.5 ? "warning" : "success"}
        />
        <MetricCard
          label="Negative Reviews"
          value={negative}
          tone={negative > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Positive Share"
          value={
            total ? `${(((total - negative) / total) * 100).toFixed(1)}%` : "0%"
          }
          tone={
            total > 0 && (total - negative) / total < 0.8
              ? "warning"
              : "success"
          }
        />
      </div>

      <Panel>
        <SectionHeader
          title="Recent Reviews"
          description="Monitor feedback and link to disputes when necessary."
        />
        <Table
          columns={[
            "id",
            "vendor_id",
            "user_id",
            "rating",
            "comment",
            "created_at",
            "actions",
          ]}
          rows={reviews || []}
          renderCell={(row, col) => {
            switch (col) {
              case "id":
                return row.id;
              case "vendor_id":
                return row.vendor_id;
              case "user_id":
                return row.user_id;
              case "rating":
                return (
                  <Badge
                    label={`${row.rating}/5`}
                    tone={
                      Number(row.rating) <= 2
                        ? "danger"
                        : Number(row.rating) >= 4
                          ? "success"
                          : "default"
                    }
                  />
                );
              case "comment":
                return row.comment || row.review || "-";
              case "created_at":
                return row.created_at;
              case "actions":
                return (
                  <div className="flex gap-2">
                    <ApproveRejectActions
                      onApprove={approveReview.bind(null, row.id)}
                      onReject={rejectReview.bind(null, row.id)}
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
