export default function ListingEdit() {
  return (
    <form className="card grid gap-3 md:grid-cols-2">
      <input className="rounded-lg border border-lh-border px-3 py-2" defaultValue="Emergency Electrician in Cape Town" />
      <input className="rounded-lg border border-lh-border px-3 py-2" defaultValue="850" />
      <textarea className="min-h-24 rounded-lg border border-lh-border px-3 py-2 md:col-span-2" defaultValue="Fast response for homes and offices." />
      <button className="rounded-lg bg-lh-amber px-4 py-2 text-sm font-medium text-lh-charcoal md:col-span-2" type="submit">
        Save Changes
      </button>
    </form>
  );
}
