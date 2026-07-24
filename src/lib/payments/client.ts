import Stripe from "stripe";

let paymentClientInstance: Stripe | null = null;

export function getPaymentClient() {
  if (paymentClientInstance) {
    return paymentClientInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  paymentClientInstance = new Stripe(secretKey, {
    apiVersion: "2026-06-24.dahlia",
  });

  return paymentClientInstance;
}
