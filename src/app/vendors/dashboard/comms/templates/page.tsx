import { createServiceClient } from "@/lib/db";
import TemplateCreateForm from "@/components/comms/TemplateCreateForm";

export const dynamic = "force-dynamic";

type SearchParams = { vendorId?: string };

export default async function VendorCommsTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();

  const requestedVendorId = String(params.vendorId ?? "").trim();
  const vendorId =
    requestedVendorId ||
    String(
      (
        await supabase
          .from("seller_profiles")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data?.id ?? "",
    );

  if (!vendorId) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-muted text-sm">No vendor selected.</p>
        </div>
      </section>
    );
  }

  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, content, created_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  return (
    <section className="shell space-y-4 p-6">
      <div className="card space-y-1">
        <h1 className="text-2xl font-semibold">Reply Templates</h1>
        <p className="text-lh-muted text-sm">Vendor: {vendorId}</p>
      </div>

      <TemplateCreateForm vendorId={vendorId} />

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Saved Templates</h2>
        {(templates ?? []).length === 0 ? (
          <p className="text-lh-muted text-sm">No templates saved yet.</p>
        ) : (
          (templates ?? []).map((template) => (
            <article
              key={template.id}
              className="border-lh-border space-y-1 rounded border p-3 text-sm"
            >
              <p className="font-medium">{String(template.name)}</p>
              <p className="text-lh-muted whitespace-pre-wrap">
                {String(template.content)}
              </p>
              <p className="text-lh-muted text-xs">
                Created:{" "}
                {new Date(String(template.created_at)).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
