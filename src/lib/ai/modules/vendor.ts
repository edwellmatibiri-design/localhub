import { callAI } from "@/lib/aiClient";

type ModuleInput = {
  message: string;
  context: Record<string, unknown>;
  userId?: string;
  vendorId?: string;
};

type ModuleOutput = {
  reply: string;
  updatedContext: Record<string, unknown>;
};

export async function runVendorModule(
  input: ModuleInput,
): Promise<ModuleOutput> {
  const message = String(input.message ?? "").trim();
  const context = input.context ?? {};

  const ai = await callAI(
    `You are a LocalHub vendor assistant. Draft CRM-ready responses: lead replies, follow-ups, negotiation responses, booking confirmations, and outreach/onboarding assistance for new vendors; suggest timing, tone, pricing strategy, and clear next onboarding steps. Message: ${message}`,
  );

  return {
    reply: `${ai.text}\n\nVendor playbook: use clear next step, include one deadline, and ask one qualifying question to improve response rate.`,
    updatedContext: {
      ...context,
      vendorAssistantActive: true,
      lastVendorTask: message,
      outreachOnboardingAssist: /outreach|onboard/i.test(message.toLowerCase()),
    },
  };
}
