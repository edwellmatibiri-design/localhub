import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { leadId: string };

function qualityBadge(score: number) {
  if (score >= 70) return "High Quality Lead";
  if (score >= 40) return "Medium Quality Lead";
  return "Low Quality Lead";
}

export default async function VendorLeadDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { leadId: leadIdParam } = await params;
  const leadId = Number(leadIdParam);

  if (!Number.isFinite(leadId) || leadId <= 0) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-danger text-sm">Invalid lead id.</p>
        </div>
      </section>
    );
  }

  const supabase = createServiceClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, user_id, vendor_id, status, message, created_at")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-muted text-sm">Lead not found.</p>
        </div>
      </section>
    );
  }

  const [{ data: behaviour }, { data: trust }, { data: reputation }] =
    await Promise.all([
      supabase
        .from("user_behaviour")
        .select(
          "searches, leads_requested, leads_responded, bookings_started, bookings_completed, bookings_cancelled, messages_sent, messages_received, avg_response_time",
        )
        .eq("user_id", lead.user_id)
        .maybeSingle(),
      supabase
        .from("user_trust_profile")
        .select("trust_score")
        .eq("user_id", lead.user_id)
        .maybeSingle(),
      supabase
        .from("user_reputation")
        .select("reputation_score")
        .eq("user_id", lead.user_id)
        .maybeSingle(),
    ]);

  const scoreResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/predictive/score`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: String(lead.user_id) }),
      cache: "no-store",
    },
  );

  const payload = await scoreResponse.json();
  const leadQualityScore = Number(payload?.leadQualityScore ?? 0);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Lead Intelligence</h1>
      <section className="card space-y-1 text-sm">
        <p>
          <span className="font-medium">Lead ID:</span> {lead.id}
        </p>
        <p>
          <span className="font-medium">User:</span> {String(lead.user_id)}
        </p>
        <p>
          <span className="font-medium">Status:</span> {String(lead.status)}
        </p>
        <p>
          <span className="font-medium">Message:</span>{" "}
          {String(lead.message ?? "-")}
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-lh-muted text-xs">Lead quality score</p>
          <p className="text-xl font-semibold">{leadQualityScore}</p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Trust score</p>
          <p className="text-xl font-semibold">
            {Number(trust?.trust_score ?? 50)}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Reputation score</p>
          <p className="text-xl font-semibold">
            {Number(reputation?.reputation_score ?? 50)}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Lead badge</p>
          <p className="text-xl font-semibold">
            {qualityBadge(leadQualityScore)}
          </p>
        </div>
      </div>

      <section className="card grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
        <p>Searches: {Number(behaviour?.searches ?? 0)}</p>
        <p>Leads requested: {Number(behaviour?.leads_requested ?? 0)}</p>
        <p>Leads responded: {Number(behaviour?.leads_responded ?? 0)}</p>
        <p>Bookings started: {Number(behaviour?.bookings_started ?? 0)}</p>
        <p>Bookings completed: {Number(behaviour?.bookings_completed ?? 0)}</p>
        <p>Bookings cancelled: {Number(behaviour?.bookings_cancelled ?? 0)}</p>
        <p>Messages sent: {Number(behaviour?.messages_sent ?? 0)}</p>
        <p>Avg response time: {Number(behaviour?.avg_response_time ?? 0)}s</p>
      </section>

      <div className="flex flex-wrap gap-2">
        {leadQualityScore >= 70 && (
          <span className="badge">High Quality Lead</span>
        )}
        {leadQualityScore >= 40 && leadQualityScore < 70 && (
          <span className="badge">Medium Quality Lead</span>
        )}
        {leadQualityScore < 40 && (
          <span className="badge">Low Quality Lead</span>
        )}
      </div>
    </section>
  );
}
