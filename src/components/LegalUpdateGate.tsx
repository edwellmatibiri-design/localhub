"use client";

import { useEffect, useState } from "react";
import { LegalUpdateModal } from "./LegalUpdateModal";

type LegalDoc = {
  slug: string;
  version: string;
  updated_at?: string;
};

type LegalAcceptance = {
  document_slug: string;
  accepted_version: string;
};

export function LegalUpdateGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [requiredDocs, setRequiredDocs] = useState<LegalDoc[]>([]);
  const [latestDocs, setLatestDocs] = useState<LegalDoc[]>([]);

  useEffect(() => {
    async function checkLegal() {
      const latestRes = await fetch("/api/legal/latest");
      const latest = (await latestRes.json()) as { documents?: LegalDoc[] };

      const statusRes = await fetch("/api/legal/user-status");
      const status = (await statusRes.json()) as {
        accepted?: LegalAcceptance[];
      };

      const acceptedMap = new Map(
        (status.accepted || []).map((d) => [
          d.document_slug,
          d.accepted_version,
        ]),
      );

      const needs = (latest.documents || []).filter((doc) => {
        const acceptedVersion = acceptedMap.get(doc.slug);
        return !acceptedVersion || acceptedVersion !== doc.version;
      });

      setLatestDocs(latest.documents || []);
      setRequiredDocs(needs);
      setLoading(false);
    }

    checkLegal();
  }, []);

  if (loading) {
    return null;
  }

  if (requiredDocs.length > 0) {
    return (
      <LegalUpdateModal
        requiredDocs={requiredDocs}
        latestDocs={latestDocs}
        onComplete={() => setRequiredDocs([])}
      />
    );
  }

  return <>{children}</>;
}
