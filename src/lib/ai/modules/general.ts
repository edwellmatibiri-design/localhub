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

export async function runGeneralModule(
  input: ModuleInput,
): Promise<ModuleOutput> {
  const message = String(input.message ?? "").trim();
  const context = input.context ?? {};

  const ai = await callAI(
    `You are LocalHub AI Concierge. Give concise helpful guidance and suggest next action. Message: ${message}`,
  );

  return {
    reply: ai.text,
    updatedContext: {
      ...context,
      lastGeneralPrompt: message,
    },
  };
}
