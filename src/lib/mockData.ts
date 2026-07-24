import type {
  Category,
  Lead,
  Listing,
  Message,
  SellerProfile,
  Suburb,
} from "@/types";

export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Plumbing",
    slug: "plumbing",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-2",
    name: "Electrical",
    slug: "electrical",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-3",
    name: "Cleaning",
    slug: "cleaning",
    created_at: new Date().toISOString(),
  },
];

export const suburbs: Suburb[] = [
  {
    id: "sub-1",
    name: "Sandton",
    slug: "sandton",
    city: "Johannesburg",
    created_at: new Date().toISOString(),
  },
  {
    id: "sub-2",
    name: "Sea Point",
    slug: "sea-point",
    city: "Cape Town",
    created_at: new Date().toISOString(),
  },
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

export const sellerProfiles: SellerProfile[] = [
  {
    id: "seller-1",
    user_id: "user-seller-1",
    business_name: "Sandton Rapid Plumbing",
    contact_email: "team@sandtonrapid.example",
    contact_phone: "+27111234567",
    category_id: "cat-1",
    suburb_id: "sub-1",
    description: "Emergency and maintenance plumbing across Sandton.",
    logo_url: null,
    trust_score: 4.5,
    review_count: 1,
    last_review_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "seller-2",
    user_id: "user-seller-2",
    business_name: "Sea Point Move Crew",
    contact_email: "hello@seapointmove.example",
    contact_phone: "+27211234567",
    category_id: "cat-3",
    suburb_id: "sub-2",
    description: "Apartment and office moving specialists.",
    logo_url: null,
    trust_score: 4.2,
    review_count: 0,
    last_review_at: null,
    created_at: new Date().toISOString(),
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

export const messages: Message[] = [
  {
    id: "msg-1",
    sender_id: "user-1",
    receiver_id: "user-seller-1",
    listing_id: "lst-1",
    content: "Hi, can you assist with a burst pipe today?",
    created_at: new Date().toISOString(),
    seen: true,
  },
  {
    id: "msg-2",
    sender_id: "user-seller-1",
    receiver_id: "user-1",
    listing_id: "lst-1",
    content: "Yes, we can be there in 45 minutes.",
    created_at: new Date().toISOString(),
    seen: false,
  },
];
