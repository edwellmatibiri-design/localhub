type ListingCreateProps = {
  action?: (formData: FormData) => void | Promise<void>;
};

export default function ListingCreate({ action }: ListingCreateProps) {
  return (
    <form className="card grid gap-3 md:grid-cols-2" action={action}>
      <input
        className="border-lh-border rounded-lg border px-3 py-2 md:col-span-2"
        name="seller_id"
        placeholder="Seller UUID"
      />
      <input
        className="border-lh-border rounded-lg border px-3 py-2"
        name="title"
        placeholder="Listing title"
      />
      <input
        className="border-lh-border rounded-lg border px-3 py-2"
        name="price"
        placeholder="Price"
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
        placeholder="Description"
      />
      <input type="hidden" name="is_active" value="true" />
      <button
        className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium md:col-span-2"
        type="submit"
      >
        Publish Listing
      </button>
    </form>
  );
}
