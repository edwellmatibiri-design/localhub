import type { IntentResult } from "./intentClassifier";

export function logAnalytics(intent: IntentResult) {
  console.log("Support analytics:", intent);
}
