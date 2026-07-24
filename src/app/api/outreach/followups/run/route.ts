import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { planOutreachFollowUp } from "@/lib/ai/outreach/followUpEngine";
import {
  logOutreachMessage,
  pickPrimaryChannel,
} from "@/lib/outreach/automation";
import { logEvent } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await logEvent("outreach_followups_run", { timestamp: Date.now() });

    const supabase = createServiceClient();

    const { data: dueFollowups, error: followupsError } = await supabase
      .from("outreach_followups")
      .select("id, business_id, scheduled_at, sent")
      .eq("sent", false)
      .lt("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(200);

    if (followupsError) {
      return NextResponse.json(
        { ok: false, error: followupsError.message },
        { status: 500 },
      );
    }

    let sentCount = 0;
    let stoppedCount = 0;

    for (const followup of dueFollowups ?? []) {
      const businessId = Number(followup.business_id);
      const { data: business } = await supabase
        .from("outreach_businesses")
        .select(
          "id, business_name, category, location, email, phone, whatsapp_number, instagram_handle, facebook_page, tiktok_handle, website, status",
        )
        .eq("id", businessId)
        .maybeSingle();

      if (!business) {
        await supabase
          .from("outreach_followups")
          .update({ sent: true })
          .eq("id", followup.id);
        stoppedCount += 1;
        continue;
      }

      const plan = await planOutreachFollowUp({
        businessId,
        previousStatus: String(business.status ?? "new"),
      });

      if (!plan.nextFollowUpMessage || !plan.nextFollowUpTime) {
        await supabase
          .from("outreach_followups")
          .update({ sent: true })
          .eq("id", followup.id);
        stoppedCount += 1;
        continue;
      }

      const channel = pickPrimaryChannel(business);
      await logOutreachMessage({
        businessId,
        channel,
        message: plan.nextFollowUpMessage,
        direction: "outbound",
        status: "sent",
      });

      await supabase
        .from("outreach_followups")
        .update({ sent: true })
        .eq("id", followup.id);
      await supabase.from("outreach_followups").insert({
        business_id: businessId,
        scheduled_at: plan.nextFollowUpTime,
        sent: false,
      });

      sentCount += 1;
    }

    return NextResponse.json({
      ok: true,
      sent: sentCount,
      stopped: stoppedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run outreach follow-ups",
      },
      { status: 500 },
    );
  }
}
