export type OverrideRequest = {
  reviewerId: string;
  reason: string;
  expiresAtIso: string;
};

export type OverrideDecision = {
  approved: boolean;
  auditMessage: string;
};

export function createOverrideDecision(request: OverrideRequest): OverrideDecision {
  const validExpiry = !Number.isNaN(new Date(request.expiresAtIso).valueOf());
  const approved = request.reason.trim().length >= 10 && validExpiry;

  return {
    approved,
    auditMessage: approved
      ? `Override approved by ${request.reviewerId}`
      : `Override denied for ${request.reviewerId}`,
  };
}
