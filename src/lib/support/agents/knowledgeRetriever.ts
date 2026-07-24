import kb from "../kb/index";
import type { IntentResult } from "./intentClassifier";

export function retrieveKnowledge(
  category: IntentResult["category"],
  userType: IntentResult["userType"],
) {
  return kb[category]?.[userType] || kb[category]?.general || null;
}
