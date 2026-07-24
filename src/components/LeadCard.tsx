import type { Lead } from "@/types";

export default function LeadCard({ lead }: { lead: Lead }) {
  return (
    <article className="card">
      <p className="text-lh-muted text-xs tracking-[0.16em] uppercase">
        Lead Status
      </p>
      <p className="mt-2 font-semibold capitalize">{lead.status}</p>
      <p className="text-lh-muted mt-2 text-sm">{lead.message}</p>
    </article>
  );
}
