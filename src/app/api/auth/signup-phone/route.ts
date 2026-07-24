import { AUTH_STRATEGY } from "@/lib/authConfig";
import { appFail } from "@/lib/api";

export async function POST() {
  if (!AUTH_STRATEGY.phoneOTP) {
    return appFail(
      503,
      "Phone OTP is not available in this version of LocalHub.",
    );
  }

  return appFail(
    503,
    "Phone OTP is not available in this version of LocalHub.",
  );
}
