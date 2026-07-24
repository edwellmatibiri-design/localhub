import { callAI } from "@/lib/aiClient";
import {
  appOk,
  parseBody,
  requireInternalApiSecretFromRequest,
} from "@/lib/api";

export async function POST(request: Request) {
  const denied = requireInternalApiSecretFromRequest(request);
  if (denied) return denied;

  const body = await parseBody<{ content?: string }>(request);
  const content = String(body?.content ?? "");

  return appOk(
    await callAI(
      `Rewrite this listing for better conversion and SEO: ${content}`,
    ),
  );
}
