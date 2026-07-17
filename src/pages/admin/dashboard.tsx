import Layout from "@/components/Layout";
import DashboardMaster from "@/components/DashboardMaster";
import AutoBuilderDashboard from "@/components/AutoBuilderDashboard";

export default function AdminDashboardPage() {
  return (
    <Layout>
      <div className="space-y-4">
        <DashboardMaster />
        <AutoBuilderDashboard />
      </div>
    </Layout>
  );
}
