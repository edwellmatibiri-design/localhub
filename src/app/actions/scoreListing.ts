"use server";

import Groq from "groq-sdk";

import { createServiceClient } from "@/lib/db";
import { rankListingScore } from "@/lib/vendor/trust";

function extractScore(text: string): number | null {
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export async function scoreListing(listingId: string) {
  const supabase = await createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("title, description, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return { success: false, message: "Listing not found" };
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return { success: false, message: "AI_API_KEY is not configured" };
  }

  const groq = new Groq({ apiKey });

  const prompt = [
    "Evaluate this listing for quality, clarity, trustworthiness, and completeness.",
    "Return only a single integer score from 0 to 100.",
    `Title: ${listing.title}`,
    `Description: ${listing.description}`,
  ].join("\n");

  const ai = await groq.chat.completions.create({
    model: process.env.AI_MODEL ?? "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const raw = ai.choices[0]?.message?.content ?? "";
  const score = extractScore(raw);

  if (score === null) {
    return { success: false, message: "Could not parse AI score" };
  }

  const finalScore = rankListingScore(score, listing.seller_id);

  const { error } = await supabase
    .from("listings")
    .update({ quality_score: finalScore, updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, score: finalScore };
}
