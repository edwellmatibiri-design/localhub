import Layout from "@/components/Layout";

export default function SignupPhonePage() {
  return (
    <Layout>
      <form className="card space-y-3">
        <h2 className="text-2xl font-semibold">Sign up with Phone</h2>
        <input type="tel" className="w-full rounded-lg border border-lh-border px-3 py-2" placeholder="+27" />
        <button className="rounded-lg bg-lh-emerald px-4 py-2 text-sm font-medium text-white" type="submit">Send OTP</button>
      </form>
    </Layout>
  );
}
