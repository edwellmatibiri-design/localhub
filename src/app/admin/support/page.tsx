export default function AdminSupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-4 text-2xl font-semibold">Support Tickets</h1>
      <p className="text-lh-text-secondary mb-6">
        View escalated issues from users and vendors.
      </p>

      <div className="border-lh-border bg-lh-surface-soft rounded-xl border p-6">
        <p>No tickets yet. Escalations will appear here.</p>
      </div>
    </div>
  );
}
