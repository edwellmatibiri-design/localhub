type EventPayload = Record<string, string | number | boolean | null>;

export async function trackEvent(event: string, payload: EventPayload = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", event, payload);
  }

  return {
    event,
    payload,
    sentAt: new Date().toISOString(),
  };
}
