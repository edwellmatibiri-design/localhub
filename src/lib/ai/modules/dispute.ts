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

export async function runDisputeModule(
  input: ModuleInput,
): Promise<ModuleOutput> {
  const message = String(input.message ?? "").trim();
  const context = input.context ?? {};

  const ai = await callAI(
    `You are a LocalHub dispute assistant. Help users summarize incidents clearly, help vendors respond professionally with evidence, and help admins summarize dispute history neutrally. Message: ${message}`,
  );

  return {
    reply: `${ai.text}\n\nDispute structure: timeline, agreed scope, what changed, proof (photos/chats/invoice), and preferred resolution.`,
    updatedContext: {
      ...context,
      disputeAssistantActive: true,
      lastDisputePrompt: message,
    },
  };
}
