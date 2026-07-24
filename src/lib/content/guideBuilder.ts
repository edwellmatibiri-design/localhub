type GuideParams = {
  intentId?: number | null;
  category?: string | null;
  location?: string | null;
  seedTitle?: string | null;
};

type GuideSection = {
  heading: string;
  body: string;
};

export type GuideContent = {
  sections: GuideSection[];
  tags: string[];
};

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}

export function slugify(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildGuide(params: GuideParams): {
  title: string;
  summary: string;
  content: GuideContent;
  slugBase: string;
} {
  const category = clean(params.category) || "local services";
  const location = clean(params.location);
  const locationLabel = location ? ` in ${location}` : "";
  const title =
    clean(params.seedTitle) || `Complete Guide to ${category}${locationLabel}`;

  const summary = `Learn how to choose the right ${category} provider${locationLabel}, compare pricing, avoid common issues, and make safer service decisions.`;

  const sections: GuideSection[] = [
    {
      heading: "Overview",
      body: `${category} services${locationLabel} can vary widely in quality and pricing. This guide helps you understand what to expect and what to prioritize before booking.`,
    },
    {
      heading: "Common Problems",
      body: `Customers often face delayed responses, unclear scopes, hidden costs, and inconsistent workmanship. Use written scopes, timeline checkpoints, and documented pricing to reduce risk.`,
    },
    {
      heading: "How to Choose a Vendor",
      body: `Shortlist vendors with clear profiles, consistent reviews, transparent service descriptions, and realistic turnaround times. Ask for references and compare at least three quotes before committing.`,
    },
    {
      heading: "Pricing Guide",
      body: `Pricing depends on complexity, urgency, and materials. Request itemized quotes, clarify call-out fees, and confirm what is included to avoid unexpected add-ons.`,
    },
    {
      heading: "Safety Tips",
      body: `Verify identity on arrival, avoid full upfront cash payments, and keep communication inside the platform where possible. Document agreed scope and completion standards in writing.`,
    },
    {
      heading: "FAQs",
      body: `How fast should vendors reply? What should be in a quote? How do disputes work? Compare response speed, quote clarity, and support process before choosing a provider.`,
    },
  ];

  if (location) {
    sections.push({
      heading: "Local Considerations",
      body: `${location} demand patterns, traffic windows, and local supplier availability can impact scheduling and pricing. Book earlier for peak periods and confirm travel-related costs in advance.`,
    });
  }

  const tags = [category, location].filter(Boolean) as string[];
  return {
    title,
    summary,
    content: { sections, tags },
    slugBase: slugify(`${category}-${location || "guide"}`),
  };
}
