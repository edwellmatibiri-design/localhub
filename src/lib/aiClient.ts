import { z } from "zod";

const aiResponseSchema = z.object({
  ok: z.boolean(),
  text: z.string(),
  model: z.string(),
});

export async function callAI(prompt: string) {
  const fallback = {
    ok: true,
    text: `AI draft generated for: ${prompt.slice(0, 120)}`,
    model: process.env.LLM_MODEL ?? "default-llm",
  };

  const endpoint = process.env.LLM_API_URL;
  const apiKey = process.env.LLM_API_KEY;

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
      model: process.env.LLM_MODEL ?? "default-llm",
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
