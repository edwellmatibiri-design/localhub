import { createServiceClient } from "@/lib/db";
import CalendarBoard from "@/components/scheduling/CalendarBoard";

export const dynamic = "force-dynamic";

type SearchParams = { vendorId?: string };

export default async function VendorCalendarDashboardPage({
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

  const { data: events } = await supabase
    .from("vendor_calendar_events")
    .select(
      "id, vendor_id, staff_id, booking_id, title, description, start_at, end_at, status",
    )
    .eq("vendor_id", vendorId)
    .order("start_at", { ascending: true })
    .limit(500);

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Vendor Calendar</h1>
      <p className="text-lh-muted text-sm">
        Bookings, staff assignments, and internal events.
      </p>
      <CalendarBoard
        vendorId={vendorId}
        initialEvents={
          (events ?? []) as Array<{
            id: number;
            vendor_id: string;
            staff_id: number | null;
            booking_id: number | null;
            title: string;
            description: string | null;
            start_at: string;
            end_at: string;
            status: "scheduled" | "in_progress" | "completed" | "cancelled";
          }>
        }
      />
    </section>
  );
}
