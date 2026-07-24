import { createServiceClient } from "@/lib/db";
import { logOutreachMessage } from "@/lib/outreach/automation";

function vendorSignupLink() {
  return "{{LOCALHUB_VENDOR_SIGNUP_LINK}}";
}

export async function startOutreachOnboarding(businessId: number) {
  const id = Number(businessId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("businessId is required");
  }

  const supabase = createServiceClient();

  const { data: business, error: businessError } = await supabase
    .from("outreach_businesses")
    .select("id, business_name, status")
    .eq("id", id)
    .maybeSingle();

  if (businessError) throw new Error(businessError.message);
  if (!business) throw new Error("Business not found");

  const onboardingMessage = [
    `Hi ${String(business.business_name ?? "there")}, welcome to LocalHub onboarding.`,
    `Start your vendor signup here: ${vendorSignupLink()}`,
    "If you reply with your service areas and top categories, we can prefill part of your setup.",
  ].join(" ");

  await logOutreachMessage({
    businessId: id,
    channel: "email",
    message: onboardingMessage,
    direction: "outbound",
    status: "sent",
  });

  const { error: updateError } = await supabase
    .from("outreach_businesses")
    .update({ status: "onboarding", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) throw new Error(updateError.message);

  await supabase.from("notifications").insert({
    user_id: null,
    vendor_id: null,
    type: "outreach_onboarding_started",
    message: `Outreach onboarding started for business ${id}.`,
  });

  return { ok: true as const, businessId: id, status: "onboarding" as const };
}

export async function syncOutreachOnboardingCompletion(businessId: number) {
  const id = Number(businessId);
  if (!Number.isFinite(id) || id <= 0) {
    return { completed: false };
  }

  const supabase = createServiceClient();
  const { data: business } = await supabase
    .from("outreach_businesses")
    .select("id, email, phone")
    .eq("id", id)
    .maybeSingle();

  if (!business) return { completed: false };

  const email = String(business.email ?? "")
    .trim()
    .toLowerCase();
  const phone = String(business.phone ?? "").trim();

  let matched = false;
  if (email) {
    const { data } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("contact_email", email)
      .maybeSingle();
    matched = Boolean(data?.id);
  }

  if (!matched && phone) {
    const { data } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("contact_phone", phone)
      .maybeSingle();
    matched = Boolean(data?.id);
  }

  if (!matched) return { completed: false };

  await supabase
    .from("outreach_businesses")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id);

  return { completed: true };
}
