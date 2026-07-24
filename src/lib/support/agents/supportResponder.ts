import type { KnowledgeEntry } from "../kb/index";
import type { IntentResult } from "./intentClassifier";

export function generateSupportResponse(
  _intent: IntentResult,
  kb: KnowledgeEntry | null,
) {
  if (!kb) {
    return {
      reply: "I understand the issue. Let me gather more details.",
      followUp: "Can you describe what happened just before the issue?",
    };
  }

  return {
    reply: kb.summary,
    steps: kb.steps,
    tutorial: kb.tutorial,
  };
}
