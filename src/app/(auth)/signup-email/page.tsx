export default function SignupEmailPage() {
  return (
    <form className="card space-y-3">
      <h2 className="text-2xl font-semibold">Sign up with Email</h2>
      <input
        type="email"
        className="border-lh-border w-full rounded-lg border px-3 py-2"
        placeholder="you@example.com"
      />
      <button
        className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
        type="submit"
      >
        Send OTP
      </button>
    </form>
  );
}
