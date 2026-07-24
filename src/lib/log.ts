export async function logEvent(event: string, payload: any = {}) {
  console.log(`[EVENT] ${event}`, payload);
}
