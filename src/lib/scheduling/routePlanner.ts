import { createServiceClient } from "@/lib/db";

type RouteInput = {
  vendorId: string;
  date: string;
};

type RouteBooking = {
  bookingId: number;
  preferredDate: string | null;
  locationKey: string;
  staffAssigned: number[];
  estimatedTravelMinutes: number;
  estimatedCompletionMinutes: number;
};

function parseDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date");
  }
  return parsed;
}

function dayBounds(date: string) {
  const base = parseDate(date);
  const start = new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const end = new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
  return { start: start.toISOString(), end: end.toISOString() };
}

function pseudoDistanceScore(current: number, previous: number) {
  return Math.abs(current - previous) % 17;
}

export async function getOptimizedRoute(input: RouteInput) {
  const vendorId = String(input.vendorId ?? "").trim();
  if (!vendorId) {
    throw new Error("vendorId is required");
  }

  const { start, end } = dayBounds(input.date);
  const supabase = createServiceClient();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, preferred_date")
    .eq("vendor_id", vendorId)
    .gte("preferred_date", start)
    .lte("preferred_date", end)
    .order("preferred_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const bookingIds = (bookings ?? [])
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id) && id > 0);
  const { data: assignments } = bookingIds.length
    ? await supabase
        .from("job_assignments")
        .select("id, booking_id, staff_id")
        .in("booking_id", bookingIds)
    : {
        data: [] as Array<{ id: number; booking_id: number; staff_id: number }>,
      };

  const staffByBooking = new Map<number, number[]>();
  (assignments ?? []).forEach((assignment) => {
    const bookingId = Number(assignment.booking_id);
    const list = staffByBooking.get(bookingId) ?? [];
    list.push(Number(assignment.staff_id));
    staffByBooking.set(bookingId, list);
  });

  const sorted = [...(bookings ?? [])]
    .map((row) => ({
      bookingId: Number(row.id),
      preferredDate: row.preferred_date ? String(row.preferred_date) : null,
      locationKey: `zone-${Number(row.id) % 9}`,
    }))
    .sort(
      (a, b) =>
        a.locationKey.localeCompare(b.locationKey) || a.bookingId - b.bookingId,
    );

  let previousId = 0;
  const ordered: RouteBooking[] = sorted.map((booking, index) => {
    const travel =
      index === 0
        ? 0
        : 10 + pseudoDistanceScore(booking.bookingId, previousId) * 3;
    previousId = booking.bookingId;

    const completion = 60 + (booking.bookingId % 4) * 15;
    return {
      bookingId: booking.bookingId,
      preferredDate: booking.preferredDate,
      locationKey: booking.locationKey,
      staffAssigned: staffByBooking.get(booking.bookingId) ?? [],
      estimatedTravelMinutes: travel,
      estimatedCompletionMinutes: completion,
    };
  });

  const estimatedTravelTime = ordered.reduce(
    (sum, booking) => sum + booking.estimatedTravelMinutes,
    0,
  );
  const estimatedCompletionTime = ordered.reduce(
    (sum, booking) => sum + booking.estimatedCompletionMinutes,
    0,
  );

  return {
    vendorId,
    date: input.date,
    orderedBookings: ordered,
    estimatedTravelTime,
    estimatedCompletionTime,
  };
}
