import type { ExtractedCompetitorSignals } from "./extractor";

export type CompetitorFingerprint = {
  contentLength: number;
  schemaDiversity: number;
  internalLinkCount: number;
  hasStrongMeta: boolean;
};

export function buildFingerprint(signals: ExtractedCompetitorSignals, html: string): CompetitorFingerprint {
  return {
    contentLength: html.length,
    schemaDiversity: new Set(signals.schemaTypes).size,
    internalLinkCount: signals.internalLinks.length,
    hasStrongMeta: Boolean(signals.metaDescription && signals.metaDescription.length >= 120),
  };
}
