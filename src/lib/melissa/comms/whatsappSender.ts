type SendWhatsAppInput = {
  to: string;
  message: string;
};

// WhatsApp Cloud API sender.
// Wire this to your Meta WhatsApp Business account.
export async function sendWhatsAppMessage({ to, message }: SendWhatsAppInput) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          text: { body: message },
        }),
      },
    );

    return { ok: res.ok };
  } catch (err) {
    console.error("Melissa WhatsApp error:", err);
    return { ok: false, error: err };
  }
}
