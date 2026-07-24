import { AUTH_STRATEGY } from "@/lib/authConfig";
import { appFail, appOk, parseBody } from "@/lib/api";

export async function POST(request: Request) {
  const body = await parseBody<{ otp?: string; method?: string }>(request);
  const method = String(body?.method ?? "email").toLowerCase();
  if (method === "phone" && !AUTH_STRATEGY.phoneOTP) {
    return appFail(
      503,
      "Phone OTP is not available in this version of LocalHub.",
    );
  }

  const otp = String(body?.otp ?? "");
  if (otp.length < 4) {
    return appFail(400, "Invalid OTP");
  }

  return appOk({ verified: true, token: "localhub-session-token" });
}
