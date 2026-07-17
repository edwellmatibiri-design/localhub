export type UserRole = "user" | "seller" | "admin";

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  last_login: string | null;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  category_id: string;
  suburb_id: string;
  description: string;
  logo_url: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  category_id: string;
  suburb_id: string;
  description: string;
  price: number;
  images: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Lead {
  id: string;
  listing_id: string;
  seller_id: string;
  user_id: string;
  message: string;
  created_at: string;
  status: "new" | "contacted" | "closed";
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string | null;
  content: string;
  created_at: string;
  seen: boolean;
}

export interface Conversation {
  id: string;
  user_id: string;
  seller_id: string;
  last_message: string;
  last_message_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Suburb {
  id: string;
  name: string;
  slug: string;
  city: string;
  created_at: string;
}
