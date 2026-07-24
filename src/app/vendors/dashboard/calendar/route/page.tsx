import { createServiceClient } from "@/lib/db";
import { getOptimizedRoute } from "@/lib/scheduling/routePlanner";

export const dynamic = "force-dynamic";

type SearchParams = { vendorId?: string; date?: string };

export default async function CalendarRoutePage({
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

  const date = String(params.date ?? new Date().toISOString().slice(0, 10));
  const route = await getOptimizedRoute({ vendorId, date });

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Optimized Route</h1>
      <p className="text-lh-muted text-sm">
        Vendor: {vendorId} | Date: {date}
      </p>

      <div className="card">
        <p className="text-sm font-medium">Map placeholder</p>
        <div className="border-lh-border from-lh-accent/5 to-lh-emerald/5 mt-3 h-56 rounded border border-dashed bg-gradient-to-br" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card">
          <p className="text-lh-muted text-xs">Estimated travel time</p>
          <p className="text-xl font-semibold">
            {route.estimatedTravelTime} min
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Estimated completion time</p>
          <p className="text-xl font-semibold">
            {route.estimatedCompletionTime} min
          </p>
        </div>
        <div className="card">
          <p className="text-lh-muted text-xs">Jobs in route</p>
          <p className="text-xl font-semibold">
            {route.orderedBookings.length}
          </p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Job order</h2>
        {route.orderedBookings.length === 0 ? (
          <p className="text-lh-muted text-sm">
            No bookings for selected date.
          </p>
        ) : (
          route.orderedBookings.map((booking, index) => (
            <article
              key={booking.bookingId}
              className="border-lh-border grid gap-1 rounded border p-3 text-sm md:grid-cols-5"
            >
              <p>
                <span className="font-medium">#{index + 1}</span> Booking{" "}
                {booking.bookingId}
              </p>
              <p className="text-lh-muted">Zone: {booking.locationKey}</p>
              <p className="text-lh-muted">
                Travel: {booking.estimatedTravelMinutes} min
              </p>
              <p className="text-lh-muted">
                Completion: {booking.estimatedCompletionMinutes} min
              </p>
              <p className="text-lh-muted">
                Staff:{" "}
                {booking.staffAssigned.length
                  ? booking.staffAssigned.join(", ")
                  : "Unassigned"}
              </p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
