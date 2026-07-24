"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/db";

type TrustProfile = {
  trust_score: number;
  phone_verified: boolean;
  email_verified: boolean;
  device_verified: boolean;
  cancellation_rate: number;
  dispute_count: number;
  multi_account_risk: number;
};

function badges(profile: TrustProfile) {
  const result: string[] = [];
  if (profile.phone_verified) result.push("Phone Verified");
  if (profile.email_verified) result.push("Email Verified");
  if (profile.trust_score >= 70) result.push("Trusted User");
  if (profile.trust_score >= 90) result.push("Premium User");
  return result;
}

export default function AccountTrustPage() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const uid = String(auth?.user?.id ?? "");
        const userEmail = String(auth?.user?.email ?? "");
        setUserId(uid);
        setEmail(userEmail);

        if (!uid) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("user_trust_profile")
          .select(
            "trust_score, phone_verified, email_verified, device_verified, cancellation_rate, dispute_count, multi_account_risk",
          )
          .eq("user_id", uid)
          .maybeSingle();

        setProfile(
          (data ?? {
            trust_score: 50,
            phone_verified: false,
            email_verified: false,
            device_verified: false,
            cancellation_rate: 0,
            dispute_count: 0,
            multi_account_risk: 0,
          }) as TrustProfile,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load trust profile",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function verifyPhone() {
    if (!userId || !phone) return;
    setError(null);
    try {
      const response = await fetch("/api/identity/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phone }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed to verify phone"));
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify phone");
    }
  }

  async function verifyEmail() {
    if (!userId || !email) return;
    setError(null);
    try {
      const response = await fetch("/api/identity/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok)
        throw new Error(String(payload?.error ?? "Failed to verify email"));
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify email");
    }
  }

  return (
    <section className="shell space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Trust Profile</h1>
      {loading && (
        <p className="card text-lh-muted text-sm">Loading trust profile...</p>
      )}
      {error && <p className="card text-lh-danger text-sm">{error}</p>}

      {!loading && profile && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="card">
              <p className="text-lh-muted text-xs">Trust score</p>
              <p className="text-2xl font-semibold">{profile.trust_score}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Cancellation rate</p>
              <p className="text-2xl font-semibold">
                {profile.cancellation_rate}%
              </p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Dispute count</p>
              <p className="text-2xl font-semibold">{profile.dispute_count}</p>
            </div>
            <div className="card">
              <p className="text-lh-muted text-xs">Multi-account risk</p>
              <p className="text-2xl font-semibold">
                {profile.multi_account_risk}
              </p>
            </div>
          </div>

          <section className="card space-y-2 text-sm">
            <h2 className="text-lg font-semibold">Verification status</h2>
            <p>Phone: {profile.phone_verified ? "Verified" : "Not verified"}</p>
            <p>Email: {profile.email_verified ? "Verified" : "Not verified"}</p>
            <p>
              Device: {profile.device_verified ? "Verified" : "Not verified"}
            </p>
          </section>

          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">Actions</h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                className="border-lh-border rounded border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void verifyPhone()}
                className="border-lh-border rounded border px-3 py-2 text-xs"
              >
                Verify phone
              </button>
              <button
                type="button"
                onClick={() => void verifyEmail()}
                className="border-lh-border rounded border px-3 py-2 text-xs"
              >
                Verify email
              </button>
            </div>
            {!profile.phone_verified && (
              <p className="text-lh-muted text-xs">
                Verify your phone to increase trust score.
              </p>
            )}
          </section>

          <section className="card space-y-2">
            <h2 className="text-lg font-semibold">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {badges(profile).length === 0 ? (
                <p className="text-lh-muted text-sm">No badges yet.</p>
              ) : (
                badges(profile).map((badge) => (
                  <span key={badge} className="badge">
                    {badge}
                  </span>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
