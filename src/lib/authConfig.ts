export const AUTH_STRATEGY = {
  emailOTP: true,
  phoneOTP: false,
  smsProvider: null,
  listingCooldownHours: 24,
  fraudChecks: {
    deviceFingerprint: true,
    ipReputation: true,
    emailDomainReputation: true,
    rateLimits: true,
    highRiskManualReview: ["cars", "property", "loans", "pets"],
  },
} as const;
