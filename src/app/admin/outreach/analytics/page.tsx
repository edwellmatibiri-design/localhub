import { createServiceClient } from "@/lib/db";

export const dynamic = "force-dynamic";

function ratio(part: number, whole: number) {
  if (!whole) return 0;
  return part / whole;
}

export default async function OutreachAnalyticsPage() {
  const supabase = createServiceClient();

  const [
    { data: statsRows },
    { data: messageRows },
    { data: businessRows },
    { data: followups },
  ] = await Promise.all([
    supabase
      .from("outreach_stats")
      .select(
        "id, total_sent, total_replied, total_failed, email_open_rate, whatsapp_reply_rate, sms_reply_rate, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("outreach_messages")
      .select("id, business_id, channel, direction, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("outreach_businesses")
      .select("id, category, location, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("outreach_followups")
      .select("id, business_id, sent, scheduled_at, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const stats = (statsRows ?? [])[0] ?? {
    total_sent: 0,
    total_replied: 0,
    total_failed: 0,
    email_open_rate: 0,
    whatsapp_reply_rate: 0,
    sms_reply_rate: 0,
  };

  const businessById = new Map<
    number,
    { category: string; location: string; status: string }
  >();
  for (const business of businessRows ?? []) {
    businessById.set(Number(business.id), {
      category: String(business.category ?? "unknown"),
      location: String(business.location ?? "unknown"),
      status: String(business.status ?? "new"),
    });
  }

  const categoryPerf = new Map<
    string,
    { total: number; replied: number; completed: number }
  >();
  const locationPerf = new Map<
    string,
    { total: number; replied: number; completed: number }
  >();

  for (const business of businessRows ?? []) {
    const category = String(business.category ?? "unknown");
    const location = String(business.location ?? "unknown");
    const status = String(business.status ?? "new");

    const c = categoryPerf.get(category) ?? {
      total: 0,
      replied: 0,
      completed: 0,
    };
    c.total += 1;
    if (
      status === "responded" ||
      status === "onboarding" ||
      status === "completed"
    )
      c.replied += 1;
    if (status === "completed") c.completed += 1;
    categoryPerf.set(category, c);

    const l = locationPerf.get(location) ?? {
      total: 0,
      replied: 0,
      completed: 0,
    };
    l.total += 1;
    if (
      status === "responded" ||
      status === "onboarding" ||
      status === "completed"
    )
      l.replied += 1;
    if (status === "completed") l.completed += 1;
    locationPerf.set(location, l);
  }

  const byDayVolume = new Map<string, number>();
  const byDayReplies = new Map<string, number>();
  for (const row of messageRows ?? []) {
    const day = String(row.created_at ?? "").slice(0, 10);
    byDayVolume.set(
      day,
      (byDayVolume.get(day) ?? 0) +
        (String(row.direction ?? "") === "outbound" ? 1 : 0),
    );
    byDayReplies.set(
      day,
      (byDayReplies.get(day) ?? 0) +
        (String(row.direction ?? "") === "inbound" ? 1 : 0),
    );
  }

  const onboardingRate = ratio(
    (businessRows ?? []).filter(
      (row) => String(row.status ?? "") === "completed",
    ).length,
    (businessRows ?? []).length,
  );

  const chartRows = Array.from(byDayVolume.keys())
    .sort((a, b) => a.localeCompare(b))
    .slice(-14)
    .map((day) => {
      const volume = byDayVolume.get(day) ?? 0;
      const replies = byDayReplies.get(day) ?? 0;
      return {
        day,
        volume,
        replyRate: volume > 0 ? replies / volume : 0,
      };
    });

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Outreach Analytics</h1>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="card">
          <p className="text-lh-muted text-xs">Total sent</p>
          <p className="text-xl font-semibold">
            {Number(stats.total_sent ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Total replied</p>
          <p className="text-xl font-semibold">
            {Number(stats.total_replied ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Total failed</p>
          <p className="text-xl font-semibold">
            {Number(stats.total_failed ?? 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Email open rate</p>
          <p className="text-xl font-semibold">
            {(Number(stats.email_open_rate ?? 0) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">WhatsApp reply rate</p>
          <p className="text-xl font-semibold">
            {(Number(stats.whatsapp_reply_rate ?? 0) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">SMS reply rate</p>
          <p className="text-xl font-semibold">
            {(Number(stats.sms_reply_rate ?? 0) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Category performance</h2>
        {Array.from(categoryPerf.entries()).length === 0 ? (
          <p className="text-lh-muted text-sm">
            No outreach category data yet.
          </p>
        ) : (
          Array.from(categoryPerf.entries()).map(([category, row]) => (
            <p key={category} className="text-sm">
              {category}: {row.total} businesses, reply{" "}
              {(ratio(row.replied, row.total) * 100).toFixed(1)}%, onboarding{" "}
              {(ratio(row.completed, row.total) * 100).toFixed(1)}%
            </p>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Location performance</h2>
        {Array.from(locationPerf.entries()).length === 0 ? (
          <p className="text-lh-muted text-sm">
            No outreach location data yet.
          </p>
        ) : (
          Array.from(locationPerf.entries()).map(([location, row]) => (
            <p key={location} className="text-sm">
              {location}: {row.total} businesses, reply{" "}
              {(ratio(row.replied, row.total) * 100).toFixed(1)}%, onboarding{" "}
              {(ratio(row.completed, row.total) * 100).toFixed(1)}%
            </p>
          ))
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Charts</h2>
        {chartRows.length === 0 ? (
          <p className="text-lh-muted text-sm">
            Not enough data for charting yet.
          </p>
        ) : (
          <div className="space-y-1">
            {chartRows.map((row) => (
              <p key={row.day} className="text-sm">
                {row.day}: volume {row.volume}, reply rate{" "}
                {(row.replyRate * 100).toFixed(1)}%
              </p>
            ))}
          </div>
        )}
        <p className="text-sm">
          Overall onboarding rate: {(onboardingRate * 100).toFixed(1)}%
        </p>
        <p className="text-lh-muted text-xs">
          Tracked follow-up records: {(followups ?? []).length}
        </p>
      </section>
    </section>
  );
}
