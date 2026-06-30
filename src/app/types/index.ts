// Shared, unified data model for the whole frontend.
// Both the storefront (AppContext) and the admin panel (AdminContext) import
// these types so there is a single source of truth for the core entities.

export interface Product {
  // The storefront cart/navigation logic keys off a numeric id, so the unified
  // id type is `number`. Admin-generated products use numeric ids as well.
  id: number;
  name: string;
  // Display price string (e.g. "48,000 DT") used across the storefront UI.
  price: string;
  // Numeric price used for subtotal/total calculations.
  priceNum: number;
  oldPrice?: string | null;
  badge?: string;
  badgeColor?: string;
  rating: number;
  reviews: number;
  // Primary image source used by the storefront.
  img: string;
  category?: string;
  // Admin-only fields (optional so storefront catalog entries stay valid).
  description?: string;
  imageUrl?: string;
}

export interface User {
  // Admin-relevant fields are required; the rest are optional so a storefront
  // signup that omits some delivery details is still a valid User.
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  governorate?: string;
  postalCode?: string;
  statut?: string;
}

export interface Order {
  id: string;
  userId: string;
  productIds: number[];
  total: number;
  date: string; // ISO string
}
