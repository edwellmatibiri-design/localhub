import { sb } from "@/lib/supabase/serverClient";
import type { MelissaAlert } from "../models";
import { sendEmail } from "./emailSender";
import { sendWhatsAppMessage } from "./whatsappSender";
import { eddieAlertTemplate } from "./templates";

export async function melissaEscalate(alert: MelissaAlert) {
  const emailContent = eddieAlertTemplate(alert);

  const emailPayload = {
    to: process.env.EDDIE_EMAIL ?? "",
    subject: emailContent.subject,
    body: emailContent.body,
  };

  const whatsappPayload = {
    to: process.env.EDDIE_WHATSAPP ?? "",
    message: `
URGENT - Melissa Alert

${alert.summary}

Recommended actions:
${alert.recommendedActions.map((a) => `- ${a}`).join("\n")}

Reply if you want Melissa to take action.
    `.trim(),
  };

  const emailRes = emailPayload.to
    ? await sendEmail(emailPayload)
    : { ok: false, error: "Missing EDDIE_EMAIL" };
  const waRes = whatsappPayload.to
    ? await sendWhatsAppMessage(whatsappPayload)
    : { ok: false, error: "Missing EDDIE_WHATSAPP" };

  await sb().from("melissa_alerts").insert({
    alert_type: alert.type,
    summary: alert.summary,
    recommended_actions: alert.recommendedActions,
    sent_email: emailRes.ok,
    sent_whatsapp: waRes.ok,
    created_at: new Date().toISOString(),
  });

  await sb()
    .from("melissa_outbound_comms")
    .insert([
      {
        channel: "email",
        recipient: emailPayload.to || "",
        subject: emailPayload.subject,
        body: emailPayload.body,
        success: emailRes.ok,
        meta: { alertType: alert.type },
        created_at: new Date().toISOString(),
      },
      {
        channel: "whatsapp",
        recipient: whatsappPayload.to || "",
        subject: null,
        body: whatsappPayload.message,
        success: waRes.ok,
        meta: { alertType: alert.type },
        created_at: new Date().toISOString(),
      },
    ]);

  return {
    email: emailRes,
    whatsapp: waRes,
  };
}
