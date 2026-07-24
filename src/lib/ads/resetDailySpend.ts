import { createServiceClient } from "@/lib/db";

export async function resetDailySpend() {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { error: resetError } = await supabase
    .from("ads")
    .update({ spent_today: 0 })
    .neq("status", "paused");
  if (resetError) {
    throw new Error(resetError.message);
  }

  const { error: reactivateError } = await supabase
    .from("ads")
    .update({ status: "active" })
    .eq("status", "exhausted")
    .gte("end_date", now)
    .lte("start_date", now);

  if (reactivateError) {
    throw new Error(reactivateError.message);
  }

  return { ok: true };
}
