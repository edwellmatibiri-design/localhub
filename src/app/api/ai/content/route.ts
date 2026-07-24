import { callAI } from "@/lib/aiClient";
import {
  appOk,
  parseBody,
  requireInternalApiSecretFromRequest,
} from "@/lib/api";

export async function POST(request: Request) {
  const denied = requireInternalApiSecretFromRequest(request);
  if (denied) return denied;

  const body = await parseBody<{ prompt?: string }>(request);
  const prompt = String(body?.prompt ?? "Generate service listing content.");

  return appOk(await callAI(prompt));
}
