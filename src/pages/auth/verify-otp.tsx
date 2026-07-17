import Layout from "@/components/Layout";

export default function VerifyOtpPage() {
  return (
    <Layout>
      <form className="card space-y-3">
        <h2 className="text-2xl font-semibold">Verify OTP</h2>
        <input className="w-full rounded-lg border border-lh-border px-3 py-2" placeholder="Enter 6-digit code" />
        <button className="rounded-lg bg-lh-electric-blue px-4 py-2 text-sm font-medium text-white" type="submit">Verify</button>
      </form>
    </Layout>
  );
}
