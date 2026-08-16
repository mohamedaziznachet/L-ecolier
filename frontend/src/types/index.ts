// Shared, unified data model for the whole frontend.
// Both the storefront (AppContext) and the admin panel (AdminContext) import
// these types so there is a single source of truth for the core entities.

export interface Product {
  // The storefront cart/navigation logic keys off an id.
  id: number | string;
  name: string;
  // Display price string (e.g. "48,000 DT") used across the storefront UI.
  price: string;
  // Numeric price used for subtotal/total calculations.
  priceNum: number;
  priceBeforeDiscount?: number | null;
  discount?: number;
  oldPrice?: string | null;
  schoolLevel?: string | null;
  badge?: string;
  badgeColor?: string;
  rating: number;
  reviews: number;
  // Primary image source used by the storefront.
  img: string;
  images?: string[];
  category?: string;
  subcategory?: string;
  brand?: string;
  // Admin-only fields (optional so storefront catalog entries stay valid)
  description?: string;
  imageUrl?: string;
  stock?: number;
  availability?: 'En stock' | 'En arrivage' | 'Sur commande' | 'Epuisé' | string;
  featured?: boolean;
  status?: 'active' | 'inactive';
  specifications?: { key: string; value: string }[];
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
  isBlocked?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  ordersCount?: number;
  wishlist?: (string | number)[];
}

export interface OrderItem {
  productId: string | number;
  name: string;
  quantity: number;
  price: number; // backward compatibility
  unitPrice?: number;
  img?: string; // backward compatibility
  image?: string;
  selectedOptions?: Record<string, string>;
}

export interface Order {
  id: string;
  userId: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGovernorate?: string;
  productIds: (number | string)[];
  items?: OrderItem[];
  total: number;
  date: string; // ISO string
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryNotes?: string;
}

export interface Brand {
  _id?: string;
  id?: string;
  name: string;
  logo?: string;
  description?: string;
  createdAt?: string;
}

export interface Coupon {
  _id?: string;
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  expiresAt: string; // ISO string
  isActive: boolean;
  applicableCategories?: string[];
  createdAt?: string;
}

export interface Review {
  _id?: string;
  id?: string;
  productId: string | number;
  productName?: string;
  userId: string;
  customerName: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface AdminStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalCategories: number;
  totalBrands: number;
  totalRevenue: number;
  confirmedRevenue?: number;
  deliveredRevenue?: number;
  pendingRevenue?: number;
  cancelledRevenue?: number;
  lowStockProducts: Partial<Product>[];
  recentOrders: Partial<Order>[];
  ordersByStatus: { _id: string; count: number; totalRevenue?: number }[];
  recentSales: { _id: string; revenue: number; orders: number }[];
  topProducts?: { _id: string; name?: string; salesCount: number; img?: string; price?: number }[];
}
