export function canGeneratePage({
  keywordVolume,
  listingsCount,
}: {
  keywordVolume: number;
  listingsCount: number;
}) {
  if (keywordVolume <= 0) return false;
  if (listingsCount <= 0) return false;
  return true;
}
