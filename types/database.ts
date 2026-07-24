// ---------------------------------------------------------------------------
// TradeX database types.
// These mirror the SQL schema in supabase/migrations/0001_init.sql.
// Keep the two in sync when you change the schema.
// ---------------------------------------------------------------------------

export type VerificationStatus = "pending" | "approved" | "rejected";
export type ListingStatus = "active" | "sold" | "removed";
export type ListingCondition =
  | "new"
  | "like_new"
  | "excellent"
  | "good"
  | "fair";
export type OfferStatus = "pending" | "accepted" | "declined";
export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "completed"
  | "disputed";

export type ListingCategory =
  | "sneakers"
  | "streetwear"
  | "collectibles"
  | "apparel"
  | "accessories"
  | "other";

export type Profile = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  verification_status: VerificationStatus;
  is_admin: boolean;
  created_at: string;
}

export type Verification = {
  id: string;
  user_id: string;
  id_type: string;
  id_number: string;
  selfie_url: string | null;
  id_photo_url: string | null;
  address: string | null;
  status: VerificationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  category: ListingCategory;
  brand: string | null;
  size: string | null;
  condition: ListingCondition;
  price: number;
  description: string | null;
  image_urls: string[];
  status: ListingStatus;
  view_count: number;
  created_at: string;
}

export type Offer = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offer_amount: number;
  status: OfferStatus;
  created_at: string;
}

export type Order = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
}

export type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
}

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export type Favorite = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

// --- Supabase generated-style Database type -------------------------------
// A light version of the shape `@supabase/supabase-js` expects, so queries
// are typed. Row = shape returned; Insert/Update = shapes accepted.

type WithDefaults<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: WithDefaults<
          Profile,
          "id" | "created_at" | "verification_status" | "is_admin"
        >;
        Update: Partial<Profile>;
        Relationships: [];
      };
      verifications: {
        Row: Verification;
        Insert: WithDefaults<
          Verification,
          "id" | "submitted_at" | "reviewed_at" | "status" | "rejection_reason"
        >;
        Update: Partial<Verification>;
        Relationships: [];
      };
      listings: {
        Row: Listing;
        Insert: WithDefaults<
          Listing,
          "id" | "created_at" | "status" | "view_count" | "image_urls"
        >;
        Update: Partial<Listing>;
        Relationships: [];
      };
      offers: {
        Row: Offer;
        Insert: WithDefaults<Offer, "id" | "created_at" | "status">;
        Update: Partial<Offer>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: WithDefaults<Order, "id" | "created_at" | "status">;
        Update: Partial<Order>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: WithDefaults<Conversation, "id" | "last_message_at">;
        Update: Partial<Conversation>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: WithDefaults<Message, "id" | "created_at">;
        Update: Partial<Message>;
        Relationships: [];
      };
      favorites: {
        Row: Favorite;
        Insert: WithDefaults<Favorite, "id" | "created_at">;
        Update: Partial<Favorite>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_listing_views: {
        Args: { listing_id: string };
        Returns: undefined;
      };
      is_admin: {
        Args: { uid: string };
        Returns: boolean;
      };
      is_approved: {
        Args: { uid: string };
        Returns: boolean;
      };
    };
    Enums: {
      verification_status: VerificationStatus;
      listing_status: ListingStatus;
      listing_condition: ListingCondition;
      offer_status: OfferStatus;
      order_status: OrderStatus;
      listing_category: ListingCategory;
    };
    CompositeTypes: Record<string, never>;
  };
}
