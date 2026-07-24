import { createServiceClient } from "@/lib/db";
import PayoutProcessButton from "@/components/admin/PayoutProcessButton";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

type PayoutRow = {
  id: number;
  vendor_id: string;
  booking_id: number;
  amount: number;
  status: "pending" | "paid" | "failed";
  created_at: string;
};

export default async function AdminPayoutsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("payouts")
    .select("id, vendor_id, booking_id, amount, status, created_at")
    .order("created_at", { ascending: false });

  const payouts = (data ?? []) as PayoutRow[];

  return (
    <AppShell
      title="Payouts"
      subtitle="Vendor payouts, statuses, and reliability metrics."
    >
      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            title="Recent Payouts"
            description="Track payout flow and detect issues early."
          />
          <PayoutProcessButton />
        </div>
        <Table
          columns={[
            "id",
            "vendor_id",
            "booking_id",
            "amount",
            "status",
            "created_at",
          ]}
          rows={payouts}
          renderCell={(row, col) => {
            const payout = row as PayoutRow;
            switch (col) {
              case "id":
                return payout.id;
              case "vendor_id":
                return payout.vendor_id;
              case "booking_id":
                return payout.booking_id;
              case "amount":
                return `R ${Number(payout.amount || 0).toLocaleString("en-ZA")}`;
              case "status":
                return (
                  <Badge
                    label={payout.status}
                    tone={
                      payout.status === "failed"
                        ? "danger"
                        : payout.status === "pending"
                          ? "warning"
                          : "success"
                    }
                  />
                );
              case "created_at":
                return new Date(payout.created_at).toLocaleString();
              default:
                return "";
            }
          }}
        />
      </Panel>
    </AppShell>
  );
}
