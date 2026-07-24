export default function LeadForm() {
  return (
    <form className="card space-y-3">
      <h3 className="text-base font-semibold">Send Lead</h3>
      <textarea
        className="border-lh-border min-h-24 w-full rounded-lg border px-3 py-2"
        placeholder="Describe what you need"
      />
      <button
        className="bg-lh-emerald text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
        type="submit"
      >
        Submit Lead
      </button>
    </form>
  );
}
