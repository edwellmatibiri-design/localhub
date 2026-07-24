export type VendorDTO = {
  id: string;
  businessName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  trustScore: number;
  reviewCount: number;
};

export function toVendorDTO(input: {
  id: string;
  business_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  trust_score: number;
  review_count: number;
}): VendorDTO {
  return {
    id: input.id,
    businessName: input.business_name,
    contactEmail: input.contact_email,
    contactPhone: input.contact_phone,
    trustScore: Number(input.trust_score ?? 0),
    reviewCount: Number(input.review_count ?? 0),
  };
}
