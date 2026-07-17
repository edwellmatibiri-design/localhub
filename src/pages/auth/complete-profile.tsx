import Layout from "@/components/Layout";

export default function CompleteProfilePage() {
  return (
    <Layout>
      <form className="card grid gap-3 md:grid-cols-2">
        <h2 className="text-2xl font-semibold md:col-span-2">Complete Profile</h2>
        <input className="rounded-lg border border-lh-border px-3 py-2" placeholder="Full name" />
        <select className="rounded-lg border border-lh-border px-3 py-2">
          <option>User</option>
          <option>Seller</option>
        </select>
        <button className="rounded-lg bg-lh-amber px-4 py-2 text-sm font-medium text-lh-charcoal md:col-span-2" type="submit">Save Profile</button>
      </form>
    </Layout>
  );
}
