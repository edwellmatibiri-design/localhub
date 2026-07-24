import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Table } from "@/components/ui/Table";
import {
  ClearEventAction,
  RescheduleAction,
} from "@/components/admin/AdminActions";
import { sb } from "@/lib/supabase/serverClient";

export default async function SchedulingPage() {
  async function rescheduleAvailability(id: string | number, newDate: string) {
    "use server";
    await sb()
      .from("vendor_availability")
      .update({ start_time: newDate })
      .eq("id", id);
  }

  async function clearConflict(id: string | number) {
    "use server";
    await sb().from("schedule_conflicts").delete().eq("id", id);
  }

  const { data: schedulingMetrics } = await sb()
    .from("scheduling_metrics")
    .select("*")
    .limit(1);
  const metrics = schedulingMetrics?.[0] || {};

  const { data: availability } = await sb()
    .from("vendor_availability")
    .select("*")
    .limit(50);
  const { data: conflicts } = await sb()
    .from("schedule_conflicts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell
      title="Scheduling"
      subtitle="Availability, booking windows, and conflict detection."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="On-time Rate"
          value={`${((metrics.on_time_rate ?? 0) * 100).toFixed(1)}%`}
          tone={(metrics.on_time_rate ?? 0) < 0.9 ? "warning" : "success"}
        />
        <MetricCard
          label="Conflict Rate"
          value={`${((metrics.conflict_rate ?? 0) * 100).toFixed(1)}%`}
          tone={(metrics.conflict_rate ?? 0) > 0.05 ? "danger" : "default"}
        />
        <MetricCard
          label="Average Lead Time"
          value={`${metrics.avg_lead_days ?? 0} days`}
        />
        <MetricCard
          label="Active Availability Slots"
          value={availability?.length ?? 0}
        />
      </div>

      <Panel>
        <SectionHeader
          title="Vendor Availability"
          description="Current availability windows for vendors."
        />
        <Table
          columns={["vendor_id", "day", "start_time", "end_time", "actions"]}
          rows={availability || []}
          renderCell={(row, col) => {
            switch (col) {
              case "vendor_id":
                return row.vendor_id;
              case "day":
                return row.day_of_week;
              case "start_time":
                return row.start_time;
              case "end_time":
                return row.end_time;
              case "actions":
                return (
                  <div className="flex gap-2">
                    <RescheduleAction
                      onReschedule={rescheduleAvailability.bind(null, row.id)}
                    />
                  </div>
                );
              default:
                return "";
            }
          }}
        />
      </Panel>

      <Panel>
        <SectionHeader
          title="Schedule Conflicts"
          description="Detected overlaps or impossible bookings."
        />
        <Table
          columns={[
            "id",
            "vendor_id",
            "booking_id",
            "reason",
            "created_at",
            "actions",
          ]}
          rows={conflicts || []}
          renderCell={(row, col) => {
            switch (col) {
              case "id":
                return row.id;
              case "vendor_id":
                return row.vendor_id;
              case "booking_id":
                return row.booking_id;
              case "reason":
                return row.reason;
              case "created_at":
                return row.created_at;
              case "actions":
                return (
                  <div className="flex gap-2">
                    <ClearEventAction
                      onClear={clearConflict.bind(null, row.id)}
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
