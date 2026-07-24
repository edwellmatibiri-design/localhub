"use client";

import { useState } from "react";

type LegalDoc = {
  slug: string;
  version: string;
};

export function LegalUpdateModal({
  requiredDocs,
  latestDocs,
  onComplete,
}: {
  requiredDocs: LegalDoc[];
  latestDocs: LegalDoc[];
  onComplete: () => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleAccept() {
    setSubmitting(true);
    for (const doc of requiredDocs) {
      await fetch("/api/legal/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_slug: doc.slug, version: doc.version }),
      });
    }
    setSubmitting(false);
    onComplete();
  }

  return (
    <div className="bg-lh-bg/40 fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-lh-surface max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl p-6">
        <h2 className="mb-2 text-xl font-semibold">
          We&apos;ve updated our legal terms
        </h2>
        <p className="text-lh-text-secondary mb-4">
          To continue using LocalHub, please review and accept the updated
          documents.
        </p>
        <p className="text-lh-text-secondary mb-4 text-sm">
          {requiredDocs.length} of {latestDocs.length} legal documents require
          your acceptance.
        </p>

        <ul className="mb-4 space-y-2">
          {requiredDocs.map((doc) => (
            <li key={doc.slug} className="flex items-center justify-between">
              <span className="font-medium capitalize">
                {doc.slug.replace("_", " ")}
              </span>
              <span className="text-lh-text-secondary text-sm">
                v{doc.version}
              </span>
            </li>
          ))}
        </ul>

        <label className="mb-4 flex items-center space-x-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={() => setAccepted(!accepted)}
          />
          <span>I agree to the updated legal terms listed above.</span>
        </label>

        <button
          disabled={!accepted || submitting}
          onClick={handleAccept}
          className={`text-lh-on-accent w-full rounded-xl py-3 ${accepted && !submitting ? "bg-lh-accent" : "bg-lh-border"}`}
        >
          {submitting ? "Saving..." : "Accept & Continue"}
        </button>
      </div>
    </div>
  );
}
