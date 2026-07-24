import { appOk, requireInternalApiSecretFromRequest } from "@/lib/api";

export async function POST(request: Request) {
  const denied = requireInternalApiSecretFromRequest(request);
  if (denied) return denied;

  return appOk({
    links: [
      "/category/plumbing",
      "/suburb/sandton",
      "/service/emergency-plumbing",
    ],
  });
}
