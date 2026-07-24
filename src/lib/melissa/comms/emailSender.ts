type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
};

// Provider-agnostic email sender.
// Wire this to SendGrid, Resend, Mailgun, or SMTP.
export async function sendEmail({ to, subject, body }: SendEmailInput) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Melissa <melissa@localhub.ai>",
        to,
        subject,
        html: body.replace(/\n/g, "<br>"),
      }),
    });

    return { ok: res.ok };
  } catch (err) {
    console.error("Melissa email error:", err);
    return { ok: false, error: err };
  }
}
