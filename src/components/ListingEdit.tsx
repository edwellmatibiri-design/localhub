type ListingEditProps = {
  action?: (formData: FormData) => void | Promise<void>;
};

export default function ListingEdit({ action }: ListingEditProps) {
  return (
    <form className="card grid gap-3 md:grid-cols-2" action={action}>
      <input
        className="border-lh-border rounded-lg border px-3 py-2 md:col-span-2"
        name="id"
        placeholder="Listing UUID"
      />
      <input
        className="border-lh-border rounded-lg border px-3 py-2"
        name="title"
        defaultValue="Emergency Electrician in Cape Town"
      />
      <input
        className="border-lh-border rounded-lg border px-3 py-2"
        name="price"
        defaultValue="850"
      />
      <input
        className="border-lh-border rounded-lg border px-3 py-2"
        name="category_id"
        placeholder="Category UUID (optional)"
      />
      <input
        className="border-lh-border rounded-lg border px-3 py-2"
        name="suburb_id"
        placeholder="Suburb UUID (optional)"
      />
      <textarea
        className="border-lh-border min-h-24 rounded-lg border px-3 py-2 md:col-span-2"
        name="description"
        defaultValue="Fast response for homes and offices."
      />
      <input type="hidden" name="is_active" value="true" />
      <button
        className="bg-lh-amber text-lh-text-primary rounded-lg px-4 py-2 text-sm font-medium md:col-span-2"
        type="submit"
      >
        Save Changes
      </button>
    </form>
  );
}
