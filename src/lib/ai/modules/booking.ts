import { callAI } from "@/lib/aiClient";
import { getNextBestQuestion } from "@/lib/booking/questionsEngine";
import { buildAutoScope } from "@/lib/booking/autoScope";
import { buildInstantQuote } from "@/lib/booking/instantQuote";
import { generateBookingSummary } from "@/lib/booking/summary";

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

export async function runBookingModule(
  input: ModuleInput,
): Promise<ModuleOutput> {
  const message = String(input.message ?? "").trim();
  const context = input.context ?? {};
  const bookingAnswers = (context.bookingAnswers ?? {}) as Record<
    string,
    unknown
  >;

  let category = String(context.bookingCategory ?? "").toLowerCase();
  if (!category) {
    if (/tree|felling|stump/i.test(message)) category = "tree_felling";
    else if (/clean|home clean|office clean/i.test(message))
      category = "cleaning";
    else if (/plumb|pipe|leak|drain/i.test(message)) category = "plumbing";
    else category = "plumbing";
  }

  const keyValueMatch = message.match(/([a-z_ ]+)\s*[:=]\s*([^,\n]+)/i);
  if (keyValueMatch) {
    const key = String(keyValueMatch[1] ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    const value = String(keyValueMatch[2] ?? "").trim();
    if (key) {
      bookingAnswers[key] = /^\d+(\.\d+)?$/.test(value) ? Number(value) : value;
    }
  }

  const nextQuestion = getNextBestQuestion({
    category,
    previousAnswers: bookingAnswers,
  });

  if (nextQuestion) {
    const askReply = `To refine your booking, next question: ${nextQuestion.question}`;
    return {
      reply: askReply,
      updatedContext: {
        ...context,
        bookingFlowActive: true,
        bookingCategory: category,
        bookingAnswers,
        lastBookingQuestion: nextQuestion.question,
      },
    };
  }

  const scope = buildAutoScope({ category, answers: bookingAnswers });
  const quote = buildInstantQuote({
    job_size: scope.job_size,
    job_complexity: scope.job_complexity,
    estimated_duration: scope.estimated_duration,
  });
  const summary = generateBookingSummary({
    category,
    answers: bookingAnswers,
    scope,
    quote,
    photos: Array.isArray(context.bookingPhotos)
      ? (context.bookingPhotos as string[])
      : [],
    userNotes: String(context.bookingNotes ?? ""),
  });

  const ai = await callAI(
    `You are a LocalHub booking assistant. Explain process, pricing structure, vendor differences, cancellation rules, help choose date/time/vendor/options, and suggest best vendor choice strategy. User message: ${message}. Summary: ${summary.job_description}`,
  );

  return {
    reply: `${ai.text}\n\nJob summary: ${summary.job_description}\nAuto scope: ${scope.job_size} size, ${scope.job_complexity} complexity, ~${scope.estimated_duration}h, team ${scope.estimated_team_size}.\nInstant quote: R ${quote.price_range_min} - R ${quote.price_range_max}.\nNext step: compare 2-3 vendors by response speed, ratings, and exclusions before booking.`,
    updatedContext: {
      ...context,
      bookingFlowActive: true,
      bookingCategory: category,
      bookingAnswers,
      bookingScope: scope,
      bookingQuote: quote,
      bookingSummary: summary,
      lastBookingQuestion: message,
    },
  };
}
