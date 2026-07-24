import { appOk, requireInternalApiSecretFromRequest } from "@/lib/api";

export async function POST(request: Request) {
  const denied = requireInternalApiSecretFromRequest(request);
  if (denied) return denied;

  return appOk({
    checks: {
      sitemap: "ok",
      robots: "ok",
      schema: "queued",
      canonicals: "ok",
    },
  });
}
