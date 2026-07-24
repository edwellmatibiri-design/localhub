import { createServiceClient } from "@/lib/db";
import {
  generateOutreachMessages,
  type OutreachMessages,
} from "@/lib/ai/outreach/messageGenerator";
import { upsertCrmPipeline } from "@/lib/crm/pipeline";

export type OutreachBusinessRecord = {
  id: number;
  business_name: string;
  category: string;
  location: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  facebook_page: string | null;
  tiktok_handle: string | null;
  website: string | null;
  status: string;
};

type Channel =
  | "email"
  | "whatsapp"
  | "sms"
  | "instagram"
  | "facebook"
  | "tiktok";

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

async function sendToEmail(_to: string, _message: string) {
  return { delivered: true };
}

async function sendToWhatsApp(_to: string, _message: string) {
  return { delivered: true };
}

async function sendToSms(_to: string, _message: string) {
  return { delivered: true };
}

export function pickPrimaryChannel(business: OutreachBusinessRecord): Channel {
  if (normalize(business.whatsapp_number)) return "whatsapp";
  if (normalize(business.email)) return "email";
  if (normalize(business.phone)) return "sms";
  if (normalize(business.instagram_handle)) return "instagram";
  if (normalize(business.facebook_page)) return "facebook";
  return "tiktok";
}

export async function logOutreachMessage(input: {
  businessId: number;
  channel: Channel;
  message: string;
  direction: "outbound" | "inbound";
  status: "sent" | "delivered" | "opened" | "clicked" | "replied" | "failed";
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("outreach_messages").insert({
    business_id: input.businessId,
    channel: input.channel,
    message: input.message,
    direction: input.direction,
    status: input.status,
  });

  if (error) throw new Error(error.message);
}

export async function sendOutreachMessage(input: {
  business: OutreachBusinessRecord;
  channel: Channel;
  message: string;
}) {
  const business = input.business;
  const channel = input.channel;
  const message = input.message;

  let delivered = false;
  if (channel === "email" && normalize(business.email)) {
    delivered = (await sendToEmail(normalize(business.email), message))
      .delivered;
  } else if (channel === "whatsapp" && normalize(business.whatsapp_number)) {
    delivered = (
      await sendToWhatsApp(normalize(business.whatsapp_number), message)
    ).delivered;
  } else if (channel === "sms" && normalize(business.phone)) {
    delivered = (await sendToSms(normalize(business.phone), message)).delivered;
  }

  await logOutreachMessage({
    businessId: Number(business.id),
    channel,
    message,
    direction: "outbound",
    status: delivered ? "delivered" : "failed",
  });

  return { delivered };
}

async function incrementOutreachStats(
  fields: Partial<{
    total_sent: number;
    total_replied: number;
    total_failed: number;
  }>,
) {
  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from("outreach_stats")
    .select("id, total_sent, total_replied, total_failed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    await supabase.from("outreach_stats").insert({
      total_sent: Number(fields.total_sent ?? 0),
      total_replied: Number(fields.total_replied ?? 0),
      total_failed: Number(fields.total_failed ?? 0),
    });
    return;
  }

  await supabase
    .from("outreach_stats")
    .update({
      total_sent: Number(row.total_sent ?? 0) + Number(fields.total_sent ?? 0),
      total_replied:
        Number(row.total_replied ?? 0) + Number(fields.total_replied ?? 0),
      total_failed:
        Number(row.total_failed ?? 0) + Number(fields.total_failed ?? 0),
    })
    .eq("id", row.id);
}

async function maybeLinkVendorCrm(business: OutreachBusinessRecord) {
  const supabase = createServiceClient();
  const email = normalize(business.email).toLowerCase();
  const phone = normalize(business.phone);

  let vendorId = "";
  if (email) {
    const { data } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("contact_email", email)
      .maybeSingle();
    vendorId = String(data?.id ?? "");
  }

  if (!vendorId && phone) {
    const { data } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("contact_phone", phone)
      .maybeSingle();
    vendorId = String(data?.id ?? "");
  }

  if (!vendorId) return;

  await upsertCrmPipeline({
    vendorId,
    stage: "contacted",
    valueEstimate: 0,
    probability: 25,
    metadata: {
      source: "outreach_automation",
      outreachBusinessId: business.id,
    },
  });
}

function channelMessageMap(messages: OutreachMessages) {
  return {
    email: messages.email,
    whatsapp: messages.whatsapp,
    sms: messages.sms,
    instagram: messages.instagram,
    facebook: messages.facebook,
    tiktok: messages.tiktok,
  } as const;
}

export async function runOutreachAutomation(business: OutreachBusinessRecord) {
  const supabase = createServiceClient();
  const messages = generateOutreachMessages({
    businessName: business.business_name,
    category: business.category,
    location: business.location,
    website: business.website,
  });

  const map = channelMessageMap(messages);
  const channels: Channel[] = ["email", "whatsapp", "sms"];

  let sentCount = 0;
  let failedCount = 0;
  for (const channel of channels) {
    const result = await sendOutreachMessage({
      business,
      channel,
      message: map[channel],
    });
    if (result.delivered) sentCount += 1;
    else failedCount += 1;
  }

  await supabase
    .from("outreach_businesses")
    .update({
      status: "contacted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", business.id);

  const { count: existingFollowUps } = await supabase
    .from("outreach_followups")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if (Number(existingFollowUps ?? 0) === 0) {
    await supabase.from("outreach_followups").insert({
      business_id: business.id,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      sent: false,
    });
  }

  await incrementOutreachStats({
    total_sent: sentCount,
    total_failed: failedCount,
  });

  await maybeLinkVendorCrm(business);

  return { success: true as const };
}
