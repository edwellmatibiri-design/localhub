export default function ListingCreate() {
  return (
    <form className="card grid gap-3 md:grid-cols-2">
      <input className="rounded-lg border border-lh-border px-3 py-2" placeholder="Listing title" />
      <input className="rounded-lg border border-lh-border px-3 py-2" placeholder="Price" />
      <textarea className="min-h-24 rounded-lg border border-lh-border px-3 py-2 md:col-span-2" placeholder="Description" />
      <button className="rounded-lg bg-lh-electric-blue px-4 py-2 text-sm font-medium text-white md:col-span-2" type="submit">
        Publish Listing
      </button>
    </form>
  );
}
