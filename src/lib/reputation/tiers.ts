export type ReputationTier =
  | "High Risk"
  | "Low Reputation"
  | "Standard"
  | "Trusted"
  | "Premium";

export function getReputationTier(score: number): ReputationTier {
  const normalized = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  if (normalized <= 20) return "High Risk";
  if (normalized <= 40) return "Low Reputation";
  if (normalized <= 60) return "Standard";
  if (normalized <= 80) return "Trusted";
  return "Premium";
}
