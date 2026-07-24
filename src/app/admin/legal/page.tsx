import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  const supabase = createServiceClient();
  const { data: documents, error } = await supabase
    .from("legal_documents")
    .select("slug, version, updated_at")
    .order("slug", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-4 text-2xl font-semibold">Legal Documents</h1>
        <p className="text-lh-on-accent">
          Failed to load legal documents: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-4 text-2xl font-semibold">Legal Documents</h1>
      <p className="text-lh-on-accent mb-6">
        Manage versions of your legal documents for compliance and POPIA.
      </p>

      <table className="w-full border text-left text-sm">
        <thead>
          <tr className="text-lh-on-accent border-b">
            <th className="p-3">Slug</th>
            <th className="p-3">Version</th>
            <th className="p-3">Updated At</th>
          </tr>
        </thead>
        <tbody>
          {documents?.map((doc) => (
            <tr key={doc.slug} className="border-b">
              <td className="p-3">{doc.slug}</td>
              <td className="p-3">{doc.version}</td>
              <td className="p-3">
                {doc.updated_at
                  ? new Date(doc.updated_at).toLocaleString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
