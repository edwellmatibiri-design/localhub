import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import LeadForm from "@/components/LeadForm";
import SeoListingPage from "@/components/SeoListingPage";

export default function ListingPage() {
  const { query } = useRouter();
  const id = String(query.id ?? "listing");

  return (
    <Layout>
      <div className="grid gap-4 md:grid-cols-2">
        <SeoListingPage listingTitle={`Listing ${id}`} />
        <LeadForm />
      </div>
    </Layout>
  );
}
