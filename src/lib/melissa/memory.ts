import { sb } from "@/lib/supabase/serverClient";
import type { MelissaLogEntry } from "./models";

export async function logMelissaAction(actionType: string, payload: unknown) {
  const { error } = await sb().from("melissa_actions").insert({
    action_type: actionType,
    payload,
    created_at: new Date().toISOString(),
  });

  return !error;
}

export async function getMelissaLog(limit = 50): Promise<MelissaLogEntry[]> {
  const { data } = await sb()
    .from("melissa_actions")
    .select("id, action_type, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((entry) => ({
    id: String(entry.id),
    actionType: String(entry.action_type),
    payload: entry.payload,
    timestamp: String(entry.created_at),
  }));
}
