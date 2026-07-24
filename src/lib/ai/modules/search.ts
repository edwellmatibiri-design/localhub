import { createServiceClient } from "@/lib/db";
import { callAI } from "@/lib/aiClient";

type ModuleInput = {
  message: string;
  context: Record<string, unknown>;
  userId?: string;
  vendorId?: string;
};

type ModuleOutput = {
  reply: string;
  updatedContext: Record<string, unknown>;
};

const VAGUE_TERMS = new Set([
  "help",
  "service",
  "best",
  "options",
  "something",
  "near me",
]);

function isVagueQuery(message: string) {
  const normalized = String(message).toLowerCase().trim();
  if (!normalized) return true;
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length <= 2) return true;
  return tokens.every((token) => VAGUE_TERMS.has(token));
}

export async function runSearchModule(
  input: ModuleInput,
): Promise<ModuleOutput> {
  const message = String(input.message ?? "").trim();
  const context = input.context ?? {};

  if (isVagueQuery(message)) {
    return {
      reply:
        "I can help narrow this down. Tell me the service type, location, budget range, and urgency. For example: 'Electrician in Cape Town, under R800, today'.",
      updatedContext: {
        ...context,
        searchNeedsClarification: true,
        lastSearchPrompt: message,
      },
    };
  }

  let categories: string[] = [];
  let vendors: string[] = [];

  try {
    const supabase = createServiceClient();
    const { data: categoryRows } = await supabase
      .from("categories")
      .select("name")
      .limit(3);
    categories = (categoryRows ?? [])
      .map((row) => String(row.name ?? ""))
      .filter(Boolean);

    const { data: vendorRows } = await supabase
      .from("seller_profiles")
      .select("business_name")
      .limit(3);

    vendors = (vendorRows ?? [])
      .map((row) => String(row.business_name ?? ""))
      .filter(Boolean);
  } catch {
    // Keep AI response resilient even when lookups fail.
  }

  const ai = await callAI(
    `You are a LocalHub search concierge. User message: ${message}`,
  );

  const categoryText = categories.length
    ? `Suggested categories: ${categories.join(", ")}.`
    : "";
  const vendorText = vendors.length
    ? `Suggested vendors to inspect: ${vendors.join(", ")}.`
    : "";

  return {
    reply: `${ai.text}\n\n${categoryText} ${vendorText}`.trim(),
    updatedContext: {
      ...context,
      searchNeedsClarification: false,
      lastSearchQuery: message,
      suggestedCategories: categories,
      suggestedVendors: vendors,
    },
  };
}
