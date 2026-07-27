export type RegenerationRequest = {
  path: string;
  reason: string;
};

export type TriggerResult = {
  accepted: boolean;
  queuedAtIso: string;
};

export function triggerRevalidation(request: RegenerationRequest): TriggerResult {
  if (!request.path.startsWith("/")) {
    throw new Error("ISR trigger requires absolute path");
  }

  return {
    accepted: true,
    queuedAtIso: new Date().toISOString(),
  };
}
