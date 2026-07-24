export default function CompleteProfilePage() {
  return (
    <form className="card grid gap-3 md:grid-cols-2">
      <h2 className="text-2xl font-semibold md:col-span-2">Complete Profile</h2>
      <input
        className="border-lh-border rounded-lg border px-3 py-2"
        placeholder="Full name"
      />
      <select className="border-lh-border rounded-lg border px-3 py-2">
        <option>User</option>
        <option>Seller</option>
      </select>
      <button
        className="bg-lh-amber text-lh-text-primary rounded-lg px-4 py-2 text-sm font-medium md:col-span-2"
        type="submit"
      >
        Save Profile
      </button>
    </form>
  );
}
