export type ListingDTO = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  active: boolean;
  status: string | null;
  updatedAt: string;
};

export function toListingDTO(input: {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  is_active: boolean;
  status?: string | null;
  updated_at: string;
}): ListingDTO {
  return {
    id: input.id,
    sellerId: input.seller_id,
    title: input.title,
    description: input.description,
    price: Number(input.price ?? 0),
    active: Boolean(input.is_active),
    status: input.status ?? null,
    updatedAt: input.updated_at,
  };
}
