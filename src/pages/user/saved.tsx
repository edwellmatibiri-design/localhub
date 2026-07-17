import Layout from "@/components/Layout";
import CardListing from "@/components/CardListing";
import { listings } from "@/lib/mockData";

export default function UserSavedPage() {
  return (
    <Layout>
      <section className="grid gap-3 md:grid-cols-2">
        {listings.map((listing) => (
          <CardListing key={listing.id} listing={listing} />
        ))}
      </section>
    </Layout>
  );
}
