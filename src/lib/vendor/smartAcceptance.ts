export type SmartAcceptanceInput = {
  trustScore: number;
  reputationScore: number;
  leadQualityScore: number;
};

export type SmartAcceptanceOutput = {
  autoAccept: boolean;
  reason: string;
};

export function evaluateSmartAcceptance(
  input: SmartAcceptanceInput,
): SmartAcceptanceOutput {
  const trustScore = Number(input.trustScore ?? 0);
  const reputationScore = Number(input.reputationScore ?? 0);
  const leadQualityScore = Number(input.leadQualityScore ?? 0);

  if (trustScore < 20) {
    return {
      autoAccept: false,
      reason: "Manual approval required: low trust score",
    };
  }

  if (reputationScore < 30) {
    return {
      autoAccept: false,
      reason: "Manual approval required: low reputation score",
    };
  }

  if (leadQualityScore < 25) {
    return {
      autoAccept: false,
      reason: "Manual approval required: low lead quality score",
    };
  }

  if (trustScore > 60 && reputationScore > 60 && leadQualityScore > 50) {
    return {
      autoAccept: true,
      reason: "Auto-accepted: high trust, reputation, and lead quality",
    };
  }

  return {
    autoAccept: false,
    reason: "Manual approval required: mixed risk profile",
  };
}
