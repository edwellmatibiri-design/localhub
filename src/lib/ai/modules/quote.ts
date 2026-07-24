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

export async function runQuoteModule(
  input: ModuleInput,
): Promise<ModuleOutput> {
  const message = String(input.message ?? "").trim();
  const context = input.context ?? {};

  const ai = await callAI(
    `You are a LocalHub quote advisor. Help compare vendor pricing and draft clear quotes with scope, assumptions, exclusions, and payment milestones. Message: ${message}`,
  );

  return {
    reply: `${ai.text}\n\nQuote template: Scope | Materials | Labor | Timeline | Exclusions | Warranty | Payment terms.`,
    updatedContext: {
      ...context,
      quoteAssistantActive: true,
      lastQuotePrompt: message,
    },
  };
}
