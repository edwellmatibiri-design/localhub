import type { Category, Lead, Listing, Suburb } from "@/types";

export const categories: Category[] = [
  { id: "cat-1", name: "Plumbing", slug: "plumbing", created_at: new Date().toISOString() },
  { id: "cat-2", name: "Electrical", slug: "electrical", created_at: new Date().toISOString() },
  { id: "cat-3", name: "Cleaning", slug: "cleaning", created_at: new Date().toISOString() },
];

export const suburbs: Suburb[] = [
  { id: "sub-1", name: "Sandton", slug: "sandton", city: "Johannesburg", created_at: new Date().toISOString() },
  { id: "sub-2", name: "Sea Point", slug: "sea-point", city: "Cape Town", created_at: new Date().toISOString() },
];

export const listings: Listing[] = [
  {
    id: "lst-1",
    seller_id: "seller-1",
    title: "24/7 Plumbing Support",
    category_id: "cat-1",
    suburb_id: "sub-1",
    description: "Burst pipes, leaks, and urgent repairs in under 60 minutes.",
    price: 650,
    images: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: "lst-2",
    seller_id: "seller-2",
    title: "House Move Logistics",
    category_id: "cat-3",
    suburb_id: "sub-2",
    description: "Trusted moving team for homes and small offices.",
    price: 2500,
    images: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  },
];

export const leads: Lead[] = [
  {
    id: "lead-1",
    listing_id: "lst-1",
    seller_id: "seller-1",
    user_id: "user-1",
    message: "Need emergency repair before 6pm.",
    created_at: new Date().toISOString(),
    status: "new",
  },
];
