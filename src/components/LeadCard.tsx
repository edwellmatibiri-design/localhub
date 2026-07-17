import type { Lead } from "@/types";

export default function LeadCard({ lead }: { lead: Lead }) {
  return (
    <article className="card">
      <p className="text-xs uppercase tracking-[0.16em] text-lh-muted">Lead Status</p>
      <p className="mt-2 font-semibold capitalize">{lead.status}</p>
      <p className="mt-2 text-sm text-lh-muted">{lead.message}</p>
    </article>
  );
}
