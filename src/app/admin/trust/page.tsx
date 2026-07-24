import { createServiceClient } from "@/lib/db";
import AdminTrustActions from "@/components/trust/AdminTrustActions";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const dynamic = "force-dynamic";

export default async function AdminTrustPage() {
  const supabase = createServiceClient();

  const { data: profiles } = await supabase
    .from("user_trust_profile")
    .select(
      "user_id, trust_score, multi_account_risk, cancellation_rate, abusive_flags, bookings_locked, phone_verified, email_verified",
    )
    .order("trust_score", { ascending: true })
    .limit(5000);

  const rows = profiles ?? [];
  const highRisk = rows.filter((row) => Number(row.trust_score) < 30);
  const multiAccount = rows.filter(
    (row) => Number(row.multi_account_risk) > 20,
  );
  const highCancellation = rows.filter(
    (row) => Number(row.cancellation_rate) > 30,
  );
  const abusive = rows.filter((row) => Number(row.abusive_flags) > 0);

  return (
    <AppShell
      title="Trust and Safety"
      subtitle="Verification, compliance, and risk signals across LocalHub."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="High-risk users"
          value={highRisk.length}
          tone={highRisk.length > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Multi-account users"
          value={multiAccount.length}
          tone={multiAccount.length > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="High cancellation users"
          value={highCancellation.length}
          tone={highCancellation.length > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Abusive flagged users"
          value={abusive.length}
          tone={abusive.length > 0 ? "danger" : "default"}
        />
      </div>

      <Panel>
        <SectionHeader
          title="Risk Queue"
          description="Review user trust signals and trigger interventions."
        />
        {rows.length === 0 ? (
          <p className="text-lh-text-secondary text-sm">
            No trust profiles yet.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <article
                key={String(row.user_id)}
                className="border-lh-border bg-lh-surface-soft space-y-2 rounded-xl border p-3 text-sm"
              >
                <div className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
                  <p>
                    <span className="font-medium">User:</span>{" "}
                    {String(row.user_id)}
                  </p>
                  <p>
                    <span className="font-medium">Trust:</span>{" "}
                    {Number(row.trust_score)}
                  </p>
                  <p>
                    <span className="font-medium">Cancellation:</span>{" "}
                    {Number(row.cancellation_rate)}%
                  </p>
                  <p>
                    <span className="font-medium">Multi-account risk:</span>{" "}
                    {Number(row.multi_account_risk)}
                  </p>
                  <p>
                    <span className="font-medium">Abusive flags:</span>{" "}
                    {Number(row.abusive_flags)}
                  </p>
                  <p>
                    <span className="font-medium">Bookings lock:</span>{" "}
                    {row.bookings_locked ? "Locked" : "Open"}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {row.phone_verified ? "Verified" : "Not verified"}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {row.email_verified ? "Verified" : "Not verified"}
                  </p>
                </div>
                <AdminTrustActions userId={String(row.user_id)} />
              </article>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
