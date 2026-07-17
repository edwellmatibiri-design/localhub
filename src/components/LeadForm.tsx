export default function LeadForm() {
  return (
    <form className="card space-y-3">
      <h3 className="text-base font-semibold">Send Lead</h3>
      <textarea className="min-h-24 w-full rounded-lg border border-lh-border px-3 py-2" placeholder="Describe what you need" />
      <button className="rounded-lg bg-lh-emerald px-4 py-2 text-sm font-medium text-white" type="submit">
        Submit Lead
      </button>
    </form>
  );
}
