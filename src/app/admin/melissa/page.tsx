import { runMelissaDaily } from "@/lib/melissa/engine";
import { getMelissaLog } from "@/lib/melissa/memory";
import { sb } from "@/lib/supabase/serverClient";
import { getMelissaSafetyRules } from "@/lib/melissa/safety";
import { MelissaSafetyRules } from "@/components/admin/MelissaSafetyRules";
import { AppShell } from "@/components/layout/AppShell";
import { Panel } from "@/components/ui/Panel";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

type WeeklyOpsPayload = {
  period_start: string;
  period_end: string;
  totalTickets: number;
  highPriorityTickets: number;
  bookingSuccessRate: number;
  payoutSuccessRate: number;
  errorCount: number;
  melissaActionsCount: number;
};

export default async function MelissaAdminPage() {
  const melissaData = await runMelissaDaily("eddie-admin");
  const log = await getMelissaLog(50);
  const safetyRules = await getMelissaSafetyRules();
  const { data: weeklyReports } = await sb()
    .from("melissa_reports")
    .select("id, payload, created_at")
    .eq("type", "weekly_ops")
    .order("created_at", { ascending: false })
    .limit(4);

  const { ticketSummary, health, compliance, opsReport, alerts } = melissaData;

  return (
    <AppShell
      title="Melissa - Ops Command"
      subtitle="Executive overview of support, health, compliance, alerts, and weekly performance."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Total Tickets" value={ticketSummary.total} />
        <MetricCard
          label="High Priority"
          value={ticketSummary.highPriority}
          tone={ticketSummary.highPriority > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Booking Success"
          value={`${(health.bookingSuccessRate * 100).toFixed(1)}%`}
          tone={health.bookingSuccessRate < 0.9 ? "warning" : "success"}
        />
        <MetricCard
          label="Payout Success"
          value={`${(health.payoutSuccessRate * 100).toFixed(1)}%`}
          tone={health.payoutSuccessRate < 0.9 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader
            title="System Health and Compliance"
            description="Live view of booking, payouts, errors, and legal coverage."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-lh-text-secondary mb-2 text-xs">
                System Health
              </p>
              <ul className="text-lh-text-secondary space-y-1 text-sm">
                <li>
                  Booking success:{" "}
                  <span className="text-lh-text-primary">
                    {(health.bookingSuccessRate * 100).toFixed(1)}%
                  </span>
                </li>
                <li>
                  Payout success:{" "}
                  <span className="text-lh-text-primary">
                    {(health.payoutSuccessRate * 100).toFixed(1)}%
                  </span>
                </li>
                <li>
                  Error rate:{" "}
                  <span className="text-lh-text-primary">
                    {(health.errorRate * 100).toFixed(2)}%
                  </span>
                </li>
                <li>
                  Status:{" "}
                  <span
                    className={
                      health.status === "healthy"
                        ? "text-lh-success"
                        : "text-lh-danger"
                    }
                  >
                    {health.status}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-lh-text-secondary mb-2 text-xs">Compliance</p>
              <ul className="text-lh-text-secondary space-y-1 text-sm">
                <li>
                  POPIA acceptance:{" "}
                  <span className="text-lh-text-primary">
                    {(compliance.popiaAcceptanceCoverage * 100).toFixed(1)}%
                  </span>
                </li>
                <li>
                  Vendor verification:{" "}
                  <span className="text-lh-text-primary">
                    {(compliance.vendorVerificationCoverage * 100).toFixed(1)}%
                  </span>
                </li>
                <li>
                  Status:{" "}
                  <span
                    className={
                      compliance.status === "ok"
                        ? "text-lh-success"
                        : "text-lh-warning"
                    }
                  >
                    {compliance.status}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            title="Live Alerts from Melissa"
            description="Only truly important issues reach this panel."
          />
          {alerts.length === 0 ? (
            <p className="text-lh-text-secondary text-sm">
              No critical alerts at the moment. System is stable.
            </p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((alert, i) => (
                <li
                  key={i}
                  className="border-lh-border bg-lh-surface-soft rounded-xl border p-3"
                >
                  <p className="text-lh-danger mb-1 text-sm font-semibold">
                    {alert.summary}
                  </p>
                  <p className="text-lh-text-secondary mb-1 text-xs">
                    Recommended actions:
                  </p>
                  <ul className="text-lh-text-secondary text-xs">
                    {alert.recommendedActions.map((a, j) => (
                      <li key={j}>- {a}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader
            title="Tickets by Type"
            description="Distribution of support load across booking, payouts, ranking, and more."
          />
          <ul className="text-lh-text-secondary grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            {Object.entries(ticketSummary.byType).map(([type, count]) => (
              <li
                key={type}
                className="border-lh-border bg-lh-surface-soft flex items-center justify-between rounded-xl border px-3 py-2"
              >
                <span className="capitalize">{type}</span>
                <span className="text-lh-text-primary font-medium">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionHeader
            title="Weekly Ops Reports"
            description="High-level performance snapshots for recent weeks."
          />
          {!weeklyReports || weeklyReports.length === 0 ? (
            <p className="text-lh-text-secondary text-sm">
              No weekly reports yet. Melissa will generate them automatically.
            </p>
          ) : (
            <ul className="text-lh-text-secondary space-y-3 text-xs">
              {weeklyReports.map((report) => {
                const payload = (report.payload ??
                  null) as WeeklyOpsPayload | null;
                if (!payload) {
                  return (
                    <li
                      key={report.id}
                      className="border-lh-border bg-lh-surface-soft rounded-xl border p-3"
                    >
                      <p className="text-lh-text-primary font-medium">
                        Weekly report payload unavailable.
                      </p>
                    </li>
                  );
                }

                return (
                  <li
                    key={report.id}
                    className="border-lh-border bg-lh-surface-soft rounded-xl border p-3"
                  >
                    <p className="text-lh-text-primary mb-1 font-medium">
                      {payload.period_start} to {payload.period_end}
                    </p>
                    <p>
                      Tickets: {payload.totalTickets} (high:{" "}
                      {payload.highPriorityTickets})
                    </p>
                    <p>
                      Booking: {(payload.bookingSuccessRate * 100).toFixed(1)}%
                    </p>
                    <p>
                      Payouts: {(payload.payoutSuccessRate * 100).toFixed(1)}%
                    </p>
                    <p>Errors: {payload.errorCount}</p>
                    <p>Melissa actions: {payload.melissaActionsCount}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel>
        <SectionHeader
          title="Melissa Activity Log"
          description="Audit trail of autonomous operations and decisions."
        />
        {log.length === 0 ? (
          <p className="text-lh-text-secondary text-sm">
            No logged actions yet. Melissa will record her operations here.
          </p>
        ) : (
          <ul className="text-lh-text-secondary space-y-2 text-xs">
            {log.map((entry) => (
              <li
                key={entry.id}
                className="border-lh-border bg-lh-surface-soft flex items-center justify-between rounded-xl border px-3 py-2"
              >
                <span className="text-lh-text-primary font-medium">
                  {entry.actionType}
                </span>
                <span>{entry.timestamp}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <SectionHeader
          title="Melissa Safety Rules"
          description="Toggle Melissa autonomy capabilities without redeploying code."
        />
        <MelissaSafetyRules initialRules={safetyRules} />
      </Panel>
    </AppShell>
  );
}
