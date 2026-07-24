import { callAI } from "@/lib/aiClient";

export type IntentNode = {
  id: string;
  keyword: string;
  intent: string;
  micro_intent?: string | null;
  landing_path: string;
  score?: number | null;
  relatedIntentUrls?: string[];
};

export type GeneratedFaq = {
  question: string;
  answer: string;
};

export type GeneratedPageComponents = {
  title: string;
  metaDescription: string;
  h1: string;
  h2: string[];
  h3: string[];
  faqs: GeneratedFaq[];
  schema: Record<string, unknown>;
  internalLinks: string[];
};

type AiOutputShape = Partial<GeneratedPageComponents>;

function clampText(value: string, maxLength: number) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trim()}…`
    : value;
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function normalizeFaqs(value: unknown, fallback: GeneratedFaq[]) {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value
    .map((item) => {
      const question = String(
        (item as { question?: unknown })?.question ?? "",
      ).trim();
      const answer = String(
        (item as { answer?: unknown })?.answer ?? "",
      ).trim();
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is GeneratedFaq => Boolean(item));

  return cleaned.length ? cleaned : fallback;
}

function defaultOutput(intentNode: IntentNode): GeneratedPageComponents {
  const keyword = intentNode.keyword.trim();
  const titleBase = keyword
    ? `${keyword} services in South Africa`
    : "Find local services in South Africa";
  const title = clampText(titleBase, 60);
  const metaDescription = clampText(
    `Compare trusted ${keyword || "local"} providers on LocalHub with reviews, pricing, and fast contact options.`,
    155,
  );
  const h1 = keyword ? `${keyword} near you` : "Find local services near you";

  const h2 = [
    `Why choose LocalHub for ${keyword || "service"} providers`,
    "How to compare quotes and response time",
    "What to check before booking",
  ];

  const h3 = [
    "Pricing and availability",
    "Verified reviews and trust signals",
    "Service areas and turnaround times",
  ];

  const faqs: GeneratedFaq[] = [
    {
      question: `How do I choose the best ${keyword || "service"} provider?`,
      answer:
        "Compare response speed, transparent pricing, verified reviews, and recent project photos.",
    },
    {
      question: `How fast can ${keyword || "service"} providers respond?`,
      answer:
        "Many providers respond the same day, depending on your suburb and service urgency.",
    },
    {
      question: "Can I request multiple quotes?",
      answer:
        "Yes. Send one request and compare quotes from relevant providers before booking.",
    },
  ];

  const internalLinks = (intentNode.relatedIntentUrls ?? [])
    .filter(Boolean)
    .slice(0, 8);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: title,
        description: metaDescription,
        url: intentNode.landing_path,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return {
    title,
    metaDescription,
    h1,
    h2,
    h3,
    faqs,
    schema,
    internalLinks,
  };
}

function parseAiJson(text: string): AiOutputShape | null {
  const raw = text.trim();
  if (!raw) return null;

  const withoutFence = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence) as AiOutputShape;
  } catch {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) return null;

    const candidate = withoutFence.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate) as AiOutputShape;
    } catch {
      return null;
    }
  }
}

export async function generatePage(
  intentNode: IntentNode,
): Promise<GeneratedPageComponents> {
  const fallback = defaultOutput(intentNode);

  const prompt = [
    "You are a local SEO content generator.",
    "Return ONLY valid JSON with this exact shape:",
    "{",
    '  "title": string (max 60 chars),',
    '  "metaDescription": string (max 155 chars),',
    '  "h1": string,',
    '  "h2": string[],',
    '  "h3": string[],',
    '  "faqs": [{"question": string, "answer": string}],',
    '  "schema": object (include FAQPage + WebPage JSON-LD),',
    '  "internalLinks": string[]',
    "}",
    "",
    `Intent node id: ${intentNode.id}`,
    `Keyword: ${intentNode.keyword}`,
    `Intent: ${intentNode.intent}`,
    `Micro intent: ${intentNode.micro_intent ?? ""}`,
    `Landing path: ${intentNode.landing_path}`,
    `Related intent URLs: ${(intentNode.relatedIntentUrls ?? []).join(", ")}`,
  ].join("\n");

  const ai = await callAI(prompt);
  const parsed = parseAiJson(ai.text);
  if (!parsed) {
    return fallback;
  }

  const title = clampText(
    String(parsed.title ?? fallback.title).trim() || fallback.title,
    60,
  );
  const metaDescription = clampText(
    String(parsed.metaDescription ?? fallback.metaDescription).trim() ||
      fallback.metaDescription,
    155,
  );
  const h1 = String(parsed.h1 ?? fallback.h1).trim() || fallback.h1;
  const h2 = normalizeStringArray(parsed.h2, fallback.h2);
  const h3 = normalizeStringArray(parsed.h3, fallback.h3);
  const faqs = normalizeFaqs(parsed.faqs, fallback.faqs);
  const internalLinks = normalizeStringArray(
    parsed.internalLinks,
    fallback.internalLinks,
  ).slice(0, 12);

  let schema = fallback.schema;
  if (
    parsed.schema &&
    typeof parsed.schema === "object" &&
    !Array.isArray(parsed.schema)
  ) {
    schema = parsed.schema as Record<string, unknown>;
  }

  return {
    title,
    metaDescription,
    h1,
    h2,
    h3,
    faqs,
    schema,
    internalLinks,
  };
}
