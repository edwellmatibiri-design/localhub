import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import SeoSuburbPage from "@/components/SeoSuburbPage";

export default function SuburbPage() {
  const { query } = useRouter();
  const slug = String(query.slug ?? "suburb");

  return (
    <Layout>
      <SeoSuburbPage slug={slug} />
    </Layout>
  );
}
