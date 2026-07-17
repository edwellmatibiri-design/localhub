import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import CardPage from "@/components/CardPage";

export default function ServicePage() {
  const { query } = useRouter();
  const slug = String(query.slug ?? "service");

  return (
    <Layout>
      <CardPage title={`Service: ${slug}`}>Service discovery page with AI-generated nearby providers and internal links.</CardPage>
    </Layout>
  );
}
