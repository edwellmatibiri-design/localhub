import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import SeoCategoryPage from "@/components/SeoCategoryPage";

export default function CategoryPage() {
  const { query } = useRouter();
  const slug = String(query.slug ?? "category");

  return (
    <Layout>
      <SeoCategoryPage slug={slug} />
    </Layout>
  );
}
