import { createServiceClient } from "@/lib/db";

type AuditInput = {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("[audit] failed to persist log", error.message);
  }
}
