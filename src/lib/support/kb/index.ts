export type KnowledgeEntry = {
  summary: string;
  steps: string[];
  tutorial: string;
};

type KnowledgeBucket = {
  user?: KnowledgeEntry;
  vendor?: KnowledgeEntry;
  general?: KnowledgeEntry;
};

type KnowledgeBase = Record<string, KnowledgeBucket>;

const kb: KnowledgeBase = {
  booking: {
    user: {
      summary:
        "Booking issues usually occur due to availability or profile settings.",
      steps: [
        "Check vendor availability",
        "Ensure your profile is complete",
        "Retry booking",
      ],
      tutorial: "how_to_book",
    },
  },

  quote: {
    vendor: {
      summary: "Quotes must include price, notes, and timeline.",
      steps: [
        "Open the job",
        "Tap 'Send Quote'",
        "Enter price + notes",
        "Submit",
      ],
      tutorial: "how_to_quote",
    },
  },

  payout: {
    vendor: {
      summary: "Payouts require verified banking details and completed jobs.",
      steps: [
        "Verify banking details",
        "Ensure job is marked completed",
        "Check payout schedule",
      ],
      tutorial: "how_to_payout",
    },
  },
};

export default kb;
