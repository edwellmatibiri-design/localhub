import { sb } from "@/lib/supabase/serverClient";
import type { ComplianceMetrics } from "./models";

export async function checkCompliance(): Promise<ComplianceMetrics> {
  const [
    { count: totalUsers },
    { count: popiaAcceptedUsers },
    { count: totalVendors },
    { count: verifiedVendors },
  ] = await Promise.all([
    sb().from("user_profiles").select("id", { count: "exact", head: true }),
    sb()
      .from("legal_acceptance")
      .select("user_id", { count: "exact", head: true })
      .eq("document_slug", "popia"),
    sb().from("vendor_profiles").select("id", { count: "exact", head: true }),
    sb()
      .from("vendor_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verified", true),
  ]);

  const userTotal = totalUsers ?? 0;
  const userAccepted = popiaAcceptedUsers ?? 0;
  const vendorTotal = totalVendors ?? 0;
  const vendorVerified = verifiedVendors ?? 0;

  const popiaAcceptanceCoverage = userTotal > 0 ? userAccepted / userTotal : 1;
  const vendorVerificationCoverage =
    vendorTotal > 0 ? vendorVerified / vendorTotal : 1;

  return {
    popiaAcceptanceCoverage,
    vendorVerificationCoverage,
    status:
      popiaAcceptanceCoverage < 0.95 || vendorVerificationCoverage < 0.9
        ? "attention"
        : "ok",
  };
}
