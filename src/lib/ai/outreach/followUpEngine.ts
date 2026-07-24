import { createServiceClient } from "@/lib/db";
import { generateOutreachMessages } from "@/lib/ai/outreach/messageGenerator";

export type OutreachBusinessStatus =
  | "new"
  | "contacted"
  | "responded"
  | "onboarding"
  | "completed"
  | "failed";

export type FollowUpInput = {
  businessId: number;
  previousStatus: OutreachBusinessStatus | string;
};

export type FollowUpPlan = {
  nextFollowUpMessage: string | null;
  nextFollowUpTime: string | null;
};

const FOLLOW_UP_WINDOWS_HOURS = [24, 72, 168, 336];

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function shouldStop(previousStatus: string) {
  return ["responded", "onboarding", "completed"].includes(previousStatus);
}

export async function planOutreachFollowUp(
  input: FollowUpInput,
): Promise<FollowUpPlan> {
  const businessId = Number(input.businessId);
  const previousStatus = String(input.previousStatus ?? "")
    .trim()
    .toLowerCase();

  if (
    !Number.isFinite(businessId) ||
    businessId <= 0 ||
    shouldStop(previousStatus)
  ) {
    return { nextFollowUpMessage: null, nextFollowUpTime: null };
  }

  const supabase = createServiceClient();

  const [{ data: business }, { data: inbound }, { count: followupCount }] =
    await Promise.all([
      supabase
        .from("outreach_businesses")
        .select("id, business_name, category, location, website, status")
        .eq("id", businessId)
        .maybeSingle(),
      supabase
        .from("outreach_messages")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("direction", "inbound"),
      supabase
        .from("outreach_followups")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId),
    ]);

  const status = String(business?.status ?? previousStatus).toLowerCase();
  if (!business || shouldStop(status) || Number(inbound?.length ?? 0) > 0) {
    return { nextFollowUpMessage: null, nextFollowUpTime: null };
  }

  const followupsPlanned = Number(followupCount ?? 0);
  if (followupsPlanned >= FOLLOW_UP_WINDOWS_HOURS.length) {
    return { nextFollowUpMessage: null, nextFollowUpTime: null };
  }

  const messages = generateOutreachMessages({
    businessName: String(business.business_name ?? ""),
    category: String(business.category ?? "local services"),
    location: String(business.location ?? ""),
    website: String(business.website ?? ""),
  });

  const prefix = `Friendly follow-up ${followupsPlanned + 1}:`;
  const nextFollowUpMessage = `${prefix} ${messages.whatsapp}`;
  const nextFollowUpTime = addHours(
    new Date(),
    FOLLOW_UP_WINDOWS_HOURS[followupsPlanned],
  ).toISOString();

  return { nextFollowUpMessage, nextFollowUpTime };
}
