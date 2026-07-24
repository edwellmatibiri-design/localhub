import { appFail, appOk, parseBody } from "@/lib/api";

export async function POST(request: Request) {
  const body = await parseBody<{ email?: string }>(request);
  const email = String(body?.email ?? "").trim();
  if (!email) {
    return appFail(400, "Email is required");
  }

  return appOk({ method: "email", challenge: "otp-sent", email });
}
