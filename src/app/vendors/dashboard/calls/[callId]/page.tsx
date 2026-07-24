import Link from "next/link";
import { createServiceClient } from "@/lib/db";
import CallDetailActions from "@/components/comms/CallDetailActions";

export const dynamic = "force-dynamic";

type Params = { callId: string };
type SearchParams = { vendorId?: string };

export default async function VendorCallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { callId: callIdParam } = await params;
  const query = await searchParams;

  const callId = Number(callIdParam);
  if (!Number.isFinite(callId) || callId <= 0) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-danger text-sm">Invalid call id.</p>
        </div>
      </section>
    );
  }

  const supabase = createServiceClient();
  const requestedVendorId = String(query.vendorId ?? "").trim();

  let callQuery = supabase
    .from("call_logs")
    .select(
      "id, vendor_id, staff_id, user_id, lead_id, direction, status, started_at, ended_at, duration, recording_url",
    )
    .eq("id", callId);

  if (requestedVendorId) {
    callQuery = callQuery.eq("vendor_id", requestedVendorId);
  }

  const { data: call } = await callQuery.maybeSingle();

  if (!call) {
    return (
      <section className="shell p-6">
        <div className="card">
          <p className="text-lh-muted text-sm">Call not found.</p>
        </div>
      </section>
    );
  }

  const leadId = Number(call.lead_id);
  const { data: lead } =
    Number.isFinite(leadId) && leadId > 0
      ? await supabase
          .from("leads")
          .select("id, booking_id, status, message, created_at")
          .eq("id", leadId)
          .maybeSingle()
      : {
          data: null as {
            id: number;
            booking_id: number | null;
            status: string;
            message: string | null;
            created_at: string;
          } | null,
        };

  const bookingId = Number(lead?.booking_id);
  const { data: booking } =
    Number.isFinite(bookingId) && bookingId > 0
      ? await supabase
          .from("bookings")
          .select("id, vendor_id, user_id, status, preferred_date")
          .eq("id", bookingId)
          .maybeSingle()
      : {
          data: null as {
            id: number;
            vendor_id: string;
            user_id: string;
            status: string;
            preferred_date: string | null;
          } | null,
        };

  return (
    <section className="shell space-y-4 p-6">
      <div className="card space-y-1">
        <h1 className="text-2xl font-semibold">Call #{call.id}</h1>
        <p className="text-lh-muted text-sm">
          Vendor: {String(call.vendor_id)}
        </p>
        <p className="text-lh-muted text-sm">User: {String(call.user_id)}</p>
      </div>

      <section className="card grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-3">
        <p>
          <span className="font-medium">Direction:</span>{" "}
          {String(call.direction ?? "-")}
        </p>
        <p>
          <span className="font-medium">Status:</span>{" "}
          {String(call.status ?? "-")}
        </p>
        <p>
          <span className="font-medium">Duration:</span>{" "}
          {Number(call.duration ?? 0)} sec
        </p>
        <p>
          <span className="font-medium">Started:</span>{" "}
          {new Date(String(call.started_at)).toLocaleString()}
        </p>
        <p>
          <span className="font-medium">Ended:</span>{" "}
          {call.ended_at
            ? new Date(String(call.ended_at)).toLocaleString()
            : "-"}
        </p>
        <p>
          <span className="font-medium">Recording:</span>{" "}
          {call.recording_url ? (
            <a
              className="underline"
              href={String(call.recording_url)}
              target="_blank"
              rel="noreferrer"
            >
              Open recording
            </a>
          ) : (
            "-"
          )}
        </p>
      </section>

      <section className="card space-y-1 text-sm">
        <h2 className="text-lg font-semibold">Related Lead</h2>
        {lead ? (
          <>
            <p>
              <span className="font-medium">Lead ID:</span> {lead.id}
            </p>
            <p>
              <span className="font-medium">Lead status:</span>{" "}
              {String(lead.status)}
            </p>
            <p>
              <span className="font-medium">Lead message:</span>{" "}
              {lead.message ? String(lead.message) : "-"}
            </p>
            <p>
              <span className="font-medium">Created:</span>{" "}
              {new Date(String(lead.created_at)).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-lh-muted">No related lead attached.</p>
        )}
      </section>

      <section className="card space-y-1 text-sm">
        <h2 className="text-lg font-semibold">Related Booking</h2>
        {booking ? (
          <>
            <p>
              <span className="font-medium">Booking ID:</span> {booking.id}
            </p>
            <p>
              <span className="font-medium">Booking status:</span>{" "}
              {String(booking.status)}
            </p>
            <p>
              <span className="font-medium">Preferred date:</span>{" "}
              {booking.preferred_date
                ? new Date(String(booking.preferred_date)).toLocaleString()
                : "-"}
            </p>
          </>
        ) : (
          <p className="text-lh-muted">No related booking attached.</p>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Actions</h2>
        <CallDetailActions
          callId={Number(call.id)}
          vendorId={String(call.vendor_id)}
          userId={String(call.user_id)}
          staffId={
            Number.isFinite(Number(call.staff_id))
              ? Number(call.staff_id)
              : null
          }
          leadId={
            Number.isFinite(Number(call.lead_id)) ? Number(call.lead_id) : null
          }
        />
      </section>

      <Link
        href={`/vendors/dashboard/calls?vendorId=${encodeURIComponent(String(call.vendor_id))}`}
        className="text-sm underline"
      >
        Back to calls dashboard
      </Link>
    </section>
  );
}
