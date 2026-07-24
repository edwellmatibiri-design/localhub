import { createServiceClient } from "@/lib/db";
import {
  ensureTrustProfile,
  recalculateAndPersistTrustScore,
} from "@/lib/trust/profile";

function simpleHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `dev_${Math.abs(hash).toString(16)}`;
}

export function buildDeviceFingerprintPayload(input: {
  userAgent?: string;
  language?: string;
  platform?: string;
  timezone?: string;
  screen?: string;
}) {
  const normalized = [
    String(input.userAgent ?? ""),
    String(input.language ?? ""),
    String(input.platform ?? ""),
    String(input.timezone ?? ""),
    String(input.screen ?? ""),
  ].join("|");

  return simpleHash(normalized);
}

export function generateDeviceHashFromBrowser() {
  if (typeof window === "undefined") return "";

  const payload = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
  };

  return buildDeviceFingerprintPayload(payload);
}

export async function markDeviceVerifiedAfterSuccessfulBooking(input: {
  userId: string;
  deviceHash: string;
}) {
  const userId = String(input.userId ?? "").trim();
  const deviceHash = String(input.deviceHash ?? "").trim();
  if (!userId || !deviceHash) {
    throw new Error("userId and deviceHash are required");
  }

  const supabase = createServiceClient();
  const profile = await ensureTrustProfile(userId);

  const { error: insertError } = await supabase
    .from("user_device_fingerprints")
    .upsert(
      { user_id: userId, device_hash: deviceHash },
      { onConflict: "user_id,device_hash" },
    );

  if (insertError) throw new Error(insertError.message);

  if (!profile.device_verified) {
    await supabase
      .from("user_trust_profile")
      .update({ device_verified: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  }

  const { data: shared, error: sharedError } = await supabase
    .from("user_device_fingerprints")
    .select("user_id")
    .eq("device_hash", deviceHash)
    .neq("user_id", userId)
    .limit(50);

  if (sharedError) throw new Error(sharedError.message);

  if ((shared ?? []).length > 0) {
    const usersToPenalize = Array.from(
      new Set([userId, ...(shared ?? []).map((row) => String(row.user_id))]),
    );

    for (const uid of usersToPenalize) {
      const target = await ensureTrustProfile(uid);
      await supabase
        .from("user_trust_profile")
        .update({
          multi_account_risk: Number(target.multi_account_risk ?? 0) + 10,
          trust_score: Math.max(0, Number(target.trust_score ?? 50) - 10),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", uid);

      await recalculateAndPersistTrustScore(uid, "shared_device_detected");
    }
  } else {
    await recalculateAndPersistTrustScore(userId, "device_verified");
  }

  return { ok: true as const };
}
