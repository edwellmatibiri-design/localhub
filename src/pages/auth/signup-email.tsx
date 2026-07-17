import Layout from "@/components/Layout";

export default function SignupEmailPage() {
  return (
    <Layout>
      <form className="card space-y-3">
        <h2 className="text-2xl font-semibold">Sign up with Email</h2>
        <input type="email" className="w-full rounded-lg border border-lh-border px-3 py-2" placeholder="you@example.com" />
        <button className="rounded-lg bg-lh-electric-blue px-4 py-2 text-sm font-medium text-white" type="submit">Send OTP</button>
      </form>
    </Layout>
  );
}
