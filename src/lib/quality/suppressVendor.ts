import { createServiceClient } from "@/lib/db";

export type SuppressionStatus = "none" | "reduced" | "hidden" | "blocked";

export function getSuppressionStatus(
  vendorQualityScore: number,
): SuppressionStatus {
  if (vendorQualityScore < 15) return "blocked";
  if (vendorQualityScore < 25) return "hidden";
  if (vendorQualityScore < 40) return "reduced";
  return "none";
}

export async function suppressVendor(
  vendorId: string,
  vendorQualityScore: number,
) {
  const status = getSuppressionStatus(vendorQualityScore);
  const supabase = createServiceClient();

  if (status === "blocked") {
    await supabase
      .from("listings")
      .update({ status: "blocked", is_active: false })
      .eq("seller_id", vendorId);
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: vendorId,
      type: "listings_suppressed",
      message: "Your listings have been suppressed due to quality issues.",
    });
  } else if (status === "hidden") {
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: vendorId,
      type: "visibility_reduced",
      message: "Your visibility has been reduced due to low quality score.",
    });
  } else if (status === "reduced") {
    await supabase.from("notifications").insert({
      user_id: null,
      vendor_id: vendorId,
      type: "visibility_reduced",
      message: "Your visibility has been reduced due to low quality score.",
    });
  }

  return { suppressionStatus: status };
}
