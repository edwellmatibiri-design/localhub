import Layout from "@/components/Layout";
import ListingCreate from "@/components/ListingCreate";
import ListingEdit from "@/components/ListingEdit";

export default function SellerListingsPage() {
  return (
    <Layout>
      <div className="grid gap-4 lg:grid-cols-2">
        <ListingCreate />
        <ListingEdit />
      </div>
    </Layout>
  );
}
