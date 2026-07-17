import DashboardTile from "@/components/DashboardTile";
import Chart from "@/components/Chart";

export default function DashboardMaster() {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <DashboardTile label="Active Listings" value="3,482" tone="blue" />
        <DashboardTile label="New Leads (24h)" value="278" tone="green" />
        <DashboardTile label="SEO Tasks" value="41 Pending" tone="amber" />
      </div>
      <Chart label="Marketplace Growth (12 months)" />
    </section>
  );
}
