"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        router.push("/account/dashboard");
        router.refresh();
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!signInError) {
        router.push("/account/dashboard");
        router.refresh();
        return;
      }

      setNotice(
        "Registration successful. Please verify your email, then login.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shell p-6">
      <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border-lh-border w-full rounded-lg border px-3 py-2"
          placeholder="you@example.com"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="border-lh-border w-full rounded-lg border px-3 py-2"
          placeholder="Password"
          minLength={6}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-lh-accent text-lh-on-accent rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
        {error && <p className="text-lh-danger text-sm">{error}</p>}
        {notice && <p className="text-lh-muted text-sm">{notice}</p>}
      </form>
    </section>
  );
}
