export default function VerifyOtpPage() {
  return (
    <form className="card space-y-3">
      <h2 className="text-2xl font-semibold">Verify OTP</h2>
      <input
        className="border-lh-border w-full rounded-lg border px-3 py-2"
        placeholder="Enter 6-digit code"
      />
      <button
        className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium"
        type="submit"
      >
        Verify
      </button>
    </form>
  );
}
