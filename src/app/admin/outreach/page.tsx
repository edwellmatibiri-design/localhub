import { createServiceClient } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function triggerSend(businessId: number) {
  "use server";
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/outreach/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
      },
      body: JSON.stringify({ businessId }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to trigger outreach");
  }
}

async function markStatus(businessId: number, status: "completed" | "failed") {
  "use server";
  const supabase = createServiceClient();
  await supabase
    .from("outreach_businesses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", businessId);
}

export default async function AdminOutreachPage() {
  const supabase = createServiceClient();

  const [{ data: businesses }, { data: messageRows }, { data: followupRows }] =
    await Promise.all([
      supabase
        .from("outreach_businesses")
        .select(
          "id, business_name, category, location, email, phone, whatsapp_number, status, created_at, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(1000),
      supabase
        .from("outreach_messages")
        .select(
          "id, business_id, channel, message, direction, status, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("outreach_followups")
        .select("id, business_id, scheduled_at, sent, created_at")
        .order("scheduled_at", { ascending: true })
        .limit(2000),
    ]);

  const latestMessageByBusiness = new Map<
    number,
    { channel: string; message: string; created_at: string }
  >();
  for (const row of messageRows ?? []) {
    const key = Number(row.business_id);
    if (!latestMessageByBusiness.has(key)) {
      latestMessageByBusiness.set(key, {
        channel: String(row.channel ?? ""),
        message: String(row.message ?? ""),
        created_at: String(row.created_at ?? ""),
      });
    }
  }

  const nextFollowupByBusiness = new Map<number, string>();
  for (const row of followupRows ?? []) {
    if (Boolean(row.sent)) continue;
    const key = Number(row.business_id);
    if (!nextFollowupByBusiness.has(key)) {
      nextFollowupByBusiness.set(key, String(row.scheduled_at ?? ""));
    }
  }

  const inboundByBusiness = new Map<
    number,
    Array<{ channel: string; message: string; created_at: string }>
  >();
  for (const row of messageRows ?? []) {
    if (String(row.direction ?? "") !== "inbound") continue;
    const key = Number(row.business_id);
    const list = inboundByBusiness.get(key) ?? [];
    list.push({
      channel: String(row.channel ?? ""),
      message: String(row.message ?? ""),
      created_at: String(row.created_at ?? ""),
    });
    inboundByBusiness.set(key, list);
  }

  return (
    <section className="shell space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Vendor Outreach CRM</h1>
        <Link
          href="/admin/outreach/analytics"
          className="border-lh-border rounded border px-3 py-1 text-sm"
        >
          View outreach analytics
        </Link>
      </div>

      {!(businesses ?? []).length ? (
        <div className="card">
          <p className="text-lh-muted text-sm">No outreach businesses yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(businesses ?? []).map((business) => {
            const id = Number(business.id);
            const latest = latestMessageByBusiness.get(id);
            const nextFollowup = nextFollowupByBusiness.get(id);
            const responses = inboundByBusiness.get(id) ?? [];

            return (
              <article key={id} className="card space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {String(business.business_name ?? "Business")}
                  </p>
                  <p className="text-lh-muted text-xs tracking-wide uppercase">
                    {String(business.status ?? "new")}
                  </p>
                </div>

                <p className="text-lh-muted text-sm">
                  {String(business.category ?? "")}{" "}
                  {business.location ? `| ${String(business.location)}` : ""}
                </p>
                <p className="text-lh-muted text-sm">
                  Email: {String(business.email ?? "-")} | Phone:{" "}
                  {String(business.phone ?? "-")} | WhatsApp:{" "}
                  {String(business.whatsapp_number ?? "-")}
                </p>

                <div className="border-lh-border rounded border p-2 text-sm">
                  <p className="font-medium">Last message</p>
                  {latest ? (
                    <>
                      <p className="text-lh-muted text-xs">
                        {latest.channel} •{" "}
                        {new Date(latest.created_at).toLocaleString()}
                      </p>
                      <p className="text-lh-muted">{latest.message}</p>
                    </>
                  ) : (
                    <p className="text-lh-muted">No messages yet.</p>
                  )}
                </div>

                <p className="text-sm">
                  <span className="font-medium">Next follow-up:</span>{" "}
                  {nextFollowup
                    ? new Date(nextFollowup).toLocaleString()
                    : "None"}
                </p>

                <div className="border-lh-border space-y-1 rounded border p-2 text-sm">
                  <p className="font-medium">Response history</p>
                  {responses.length === 0 ? (
                    <p className="text-lh-muted">No inbound responses yet.</p>
                  ) : (
                    responses.slice(0, 4).map((response, index) => (
                      <p
                        key={`${id}-response-${index}`}
                        className="text-lh-muted"
                      >
                        [{response.channel}]{" "}
                        {new Date(response.created_at).toLocaleString()}:{" "}
                        {response.message}
                      </p>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <form action={triggerSend.bind(null, id)}>
                    <button
                      type="submit"
                      className="border-lh-border rounded border px-3 py-1 text-sm"
                    >
                      Trigger outreach
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await fetch(
                        `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/outreach/followups/run`,
                        {
                          method: "POST",
                          cache: "no-store",
                          headers: {
                            "x-internal-secret":
                              process.env.INTERNAL_API_SECRET ?? "",
                          },
                        },
                      );
                    }}
                  >
                    <button
                      type="submit"
                      className="border-lh-border rounded border px-3 py-1 text-sm"
                    >
                      Trigger follow-up run
                    </button>
                  </form>
                  <form action={markStatus.bind(null, id, "completed")}>
                    <button
                      type="submit"
                      className="border-lh-border rounded border px-3 py-1 text-sm"
                    >
                      Mark completed
                    </button>
                  </form>
                  <form action={markStatus.bind(null, id, "failed")}>
                    <button
                      type="submit"
                      className="border-lh-danger text-lh-danger rounded border px-3 py-1 text-sm"
                    >
                      Mark failed
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
