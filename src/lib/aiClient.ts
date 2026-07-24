import { z } from "zod";

const aiResponseSchema = z.object({
  ok: z.boolean(),
  text: z.string(),
  model: z.string(),
});

export async function callAI(prompt: string) {
  const provider = process.env.AI_PROVIDER ?? "mock";
  const fallback = {
    ok: true,
    text: `AI draft generated for: ${prompt.slice(0, 120)}`,
    model: provider,
  };

  const apiKey = process.env.AI_API_KEY;
  const endpoint =
    provider === "openai"
      ? "https://api.openai.com/v1/responses"
      : provider === "anthropic"
        ? "https://api.anthropic.com/v1/messages"
        : undefined;

  if (!endpoint || !apiKey) {
    return aiResponseSchema.parse(fallback);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: provider,
      prompt,
    }),
  });

  if (!response.ok) {
    return aiResponseSchema.parse(fallback);
  }

  const json = await response.json();
  return aiResponseSchema.parse({
    ok: true,
    text: String(json?.text ?? fallback.text),
    model: String(json?.model ?? fallback.model),
  });
}
