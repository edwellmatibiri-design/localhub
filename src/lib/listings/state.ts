type ListingStateInput = {
  is_active?: boolean | null;
  expires_at?: string | null;
};

export function isListingExpired(listing: ListingStateInput): boolean {
  if (listing.is_active === false) return true;
  if (!listing.expires_at) return false;

  const expiresAt = new Date(listing.expires_at);
  if (Number.isNaN(expiresAt.getTime())) return false;

  return expiresAt.getTime() <= Date.now();
}
