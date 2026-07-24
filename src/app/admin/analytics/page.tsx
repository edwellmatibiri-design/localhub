"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";

type AnalyticsPayload = {
  metrics: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    disputeCount: number;
    vendorResponseRate: number;
    userTrustDistribution: { low: number; medium: number; high: number };
    reputationDistribution: { low: number; medium: number; high: number };
    predictiveScoreDistribution: { low: number; medium: number; high: number };
    categoryPerformance: Array<{
      category: string;
      bookings: number;
      avgQuoteRange: number;
    }>;
    instantQuoteAccuracy: number;
    aiUsageMetrics: {
      totalSessions: number;
      userSessions: number;
      vendorSessions: number;
    };
  };
};

export default function AdminAnalyticsPage() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    vendor: "",
    user: "",
  });
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.category) params.set("category", filters.category);
      if (filters.vendor) params.set("vendor", filters.vendor);
      if (filters.user) params.set("user", filters.user);

      const response = await fetch(
        `/api/admin/analytics?${params.toString()}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(String(data?.error ?? "Failed to load analytics"));
      }

      setPayload(data as AnalyticsPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const categoryRows = useMemo(
    () => payload?.metrics.categoryPerformance ?? [],
    [payload?.metrics.categoryPerformance],
  );

  return (
    <AppShell
      title="Analytics"
      subtitle="Platform performance across bookings, vendors, and users."
    >
      <Panel className="grid gap-3 md:grid-cols-5">
        <Input
          type="date"
          value={filters.startDate}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              startDate: event.target.value,
            }))
          }
        />
        <Input
          type="date"
          value={filters.endDate}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              endDate: event.target.value,
            }))
          }
        />
        <Input
          placeholder="category"
          value={filters.category}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              category: event.target.value,
            }))
          }
        />
        <Input
          placeholder="vendor id"
          value={filters.vendor}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              vendor: event.target.value,
            }))
          }
        />
        <Input
          placeholder="user id"
          value={filters.user}
          onChange={(event) =>
            setFilters((current) => ({ ...current, user: event.target.value }))
          }
        />
        <Button
          type="button"
          onClick={() => void load()}
          className="md:col-span-2"
        >
          Apply filters
        </Button>
      </Panel>

      {loading && (
        <Panel>
          <p className="text-lh-text-secondary text-sm">Loading analytics...</p>
        </Panel>
      )}
      {error && (
        <Panel>
          <p className="text-lh-danger text-sm">{error}</p>
        </Panel>
      )}

      {payload && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Total bookings"
              value={payload.metrics.totalBookings}
            />
            <MetricCard
              label="Completed bookings"
              value={payload.metrics.completedBookings}
              tone="success"
            />
            <MetricCard
              label="Cancelled bookings"
              value={payload.metrics.cancelledBookings}
              tone="warning"
            />
            <MetricCard
              label="Dispute count"
              value={payload.metrics.disputeCount}
              tone={payload.metrics.disputeCount > 0 ? "danger" : "default"}
            />
            <MetricCard
              label="Vendor response rate"
              value={`${(payload.metrics.vendorResponseRate * 100).toFixed(1)}%`}
            />
          </div>

          <Panel>
            <SectionHeader
              title="Category performance"
              description="Scoped jobs and average quote ranges by category."
            />
            {categoryRows.length === 0 ? (
              <p className="text-lh-text-secondary text-sm">
                No category data for selected filters.
              </p>
            ) : (
              <ul className="text-lh-text-secondary space-y-2 text-sm">
                {categoryRows.map((row) => (
                  <li
                    key={row.category}
                    className="border-lh-border bg-lh-surface-soft rounded-xl border px-3 py-2"
                  >
                    {row.category}: {row.bookings} scoped jobs, avg quote range
                    R {row.avgQuoteRange}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <SectionHeader title="AI usage metrics" />
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard
                label="Total sessions"
                value={payload.metrics.aiUsageMetrics.totalSessions}
              />
              <MetricCard
                label="User sessions"
                value={payload.metrics.aiUsageMetrics.userSessions}
              />
              <MetricCard
                label="Vendor sessions"
                value={payload.metrics.aiUsageMetrics.vendorSessions}
              />
            </div>
          </Panel>

          <Panel className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary">
              Export analytics (placeholder)
            </Button>
            <Link
              href="/admin/behaviour"
              className="border-lh-border text-lh-text-secondary hover:bg-lh-surface-soft rounded-2xl border px-4 py-2 text-sm"
            >
              Inspect user behaviour
            </Link>
            <Link
              href="/admin/vendors"
              className="border-lh-border text-lh-text-secondary hover:bg-lh-surface-soft rounded-2xl border px-4 py-2 text-sm"
            >
              Inspect vendor performance
            </Link>
          </Panel>
        </>
      )}
    </AppShell>
  );
}
