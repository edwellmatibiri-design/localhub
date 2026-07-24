import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import {
  ApproveRejectActions,
  FlagAction,
} from "@/components/admin/AdminActions";
import { sb } from "@/lib/supabase/serverClient";

export default async function VendorsPage() {
  async function approveVendor(id: string) {
    "use server";
    await sb().from("vendor_profiles").update({ verified: true }).eq("id", id);
  }

  async function rejectVendor(id: string) {
    "use server";
    await sb().from("vendor_profiles").update({ verified: false }).eq("id", id);
  }

  async function flagVendor(id: string, reason: string) {
    "use server";
    await sb()
      .from("vendor_profiles")
      .update({ flagged: true, flag_reason: reason })
      .eq("id", id);
  }

  const { data: vendors } = await sb()
    .from("vendor_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const total = vendors?.length ?? 0;
  const verified =
    vendors?.filter((vendor) => Boolean(vendor.verified)).length ?? 0;
  const flagged =
    vendors?.filter((vendor) => Boolean(vendor.flagged)).length ?? 0;

  return (
    <AppShell
      title="Vendors"
      subtitle="Profiles, verification, flags, and payout reliability."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Total Vendors" value={total} />
        <MetricCard label="Verified" value={verified} tone="success" />
        <MetricCard
          label="Flagged"
          value={flagged}
          tone={flagged > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Verification Coverage"
          value={`${(total ? (verified / total) * 100 : 0).toFixed(1)}%`}
          tone={total > 0 && verified / total < 0.9 ? "warning" : "success"}
        />
      </div>

      <Panel>
        <SectionHeader
          title="Vendor Directory"
          description="Search, inspect, and manage vendor profiles."
        />
        <Table
          columns={[
            "id",
            "name",
            "category",
            "location",
            "verified",
            "flagged",
            "risk_score",
            "created_at",
            "actions",
          ]}
          rows={vendors || []}
          renderCell={(row, col) => {
            switch (col) {
              case "id":
                return row.id;
              case "name":
                return row.display_name || row.business_name || "-";
              case "category":
                return row.category || "-";
              case "location":
                return row.location || "-";
              case "verified":
                return (
                  <Badge
                    label={row.verified ? "Verified" : "Unverified"}
                    tone={row.verified ? "success" : "warning"}
                  />
                );
              case "flagged":
                return (
                  <Badge
                    label={row.flagged ? "Flagged" : "Clean"}
                    tone={row.flagged ? "danger" : "default"}
                  />
                );
              case "risk_score":
                return row.risk_score ?? "-";
              case "created_at":
                return row.created_at;
              case "actions":
                return (
                  <div className="flex gap-2">
                    <ApproveRejectActions
                      onApprove={approveVendor.bind(null, String(row.id))}
                      onReject={rejectVendor.bind(null, String(row.id))}
                    />
                    <FlagAction
                      onFlag={flagVendor.bind(null, String(row.id))}
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
