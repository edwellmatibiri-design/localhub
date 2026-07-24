import { createServiceClient } from "@/lib/db";

export const LOYALTY_BADGES = [
  "First Booking",
  "5 Bookings",
  "10 Bookings",
  "Top Reviewer",
  "Platinum Member",
] as const;

export async function syncUserBadges(userIdInput: string) {
  const userId = String(userIdInput ?? "").trim();
  if (!userId) throw new Error("userId is required");

  const supabase = createServiceClient();

  const [
    { count: bookingCount },
    { count: reviewCount },
    { data: loyaltyRow },
    { data: existingRows },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("loyalty_points")
      .select("tier")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("badges").select("badge").eq("user_id", userId),
  ]);

  const existing = new Set(
    (existingRows ?? []).map((row) => String(row.badge)),
  );
  const target = new Set<string>();

  const completedBookings = Number(bookingCount ?? 0);
  const totalReviews = Number(reviewCount ?? 0);
  const tier = String(loyaltyRow?.tier ?? "bronze");

  if (completedBookings >= 1) target.add("First Booking");
  if (completedBookings >= 5) target.add("5 Bookings");
  if (completedBookings >= 10) target.add("10 Bookings");
  if (totalReviews >= 10) target.add("Top Reviewer");
  if (tier === "platinum") target.add("Platinum Member");

  const missing = Array.from(target).filter((badge) => !existing.has(badge));
  if (missing.length > 0) {
    const { error } = await supabase
      .from("badges")
      .insert(missing.map((badge) => ({ user_id: userId, badge })));
    if (error) throw new Error(error.message);
  }

  return {
    ok: true as const,
    awarded: missing,
  };
}

export async function revokeUserBadge(userIdInput: string, badgeInput: string) {
  const userId = String(userIdInput ?? "").trim();
  const badge = String(badgeInput ?? "").trim();

  if (!userId || !badge) {
    throw new Error("userId and badge are required");
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("badges")
    .delete()
    .eq("user_id", userId)
    .eq("badge", badge);
  if (error) throw new Error(error.message);

  return { ok: true as const };
}
