import Layout from "@/components/Layout";
import LeadCard from "@/components/LeadCard";
import { leads } from "@/lib/mockData";

export default function SellerLeadsPage() {
  return (
    <Layout>
      <section className="grid gap-3 md:grid-cols-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </section>
    </Layout>
  );
}
