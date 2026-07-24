// src/app/services/api.ts
// Data-access / service layer.
//
// Every interaction with the persistence backend goes through this module.
// Migrated from localStorage mock to real MERN endpoints.

import { Product, User, Order, Brand, Coupon, Review, AdminStats } from "../types";

const KEYS = {
  currentUser: "ecolier_user",
  cart: "ecolier_cart",
  isAdmin: "admin_isAdmin",
  rememberedEmail: "ecolier_remembered_email",
  token: "ecolier_token",
  refreshToken: "ecolier_refresh_token",
} as const;

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem(KEYS.token) || localStorage.getItem("ecolier_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const options = init || {};
  options.credentials = "include";
  const token = localStorage.getItem(KEYS.token) || localStorage.getItem("ecolier_token");
  if (token) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    options.headers = headers;
  }
  return window.fetch(input, options);
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await apiFetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      logout();
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error refreshing token:", e);
    return false;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getHeaders(),
    ...(options.headers || {}),
  };
  
  let res = await apiFetch(url, { ...options, headers });
  
  if (res.status === 401) {
    const parsed = await parseJSONSafe(res.clone());
    if (parsed && parsed.code === 'TOKEN_EXPIRED') {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retryHeaders = {
          ...getHeaders(),
          ...(options.headers || {}),
        };
        res = await apiFetch(url, { ...options, headers: retryHeaders });
      }
    }
  }
  
  return res;
}

async function parseJSONSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    // Return the raw text when JSON parsing fails
    return { __rawText: text };
  }
}

// ── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  try {
    const token = localStorage.getItem(KEYS.token);
    const isAdmin = localStorage.getItem(KEYS.isAdmin) === "true";
    let res: Response;
    if (token && isAdmin) {
      res = await fetchWithAuth(`/api/admin/products`, { headers: getHeaders() });
    } else {
      res = await apiFetch(`/api/products?limit=1000`, { headers: getHeaders() });
    }

    if (!res.ok) {
      // Fallback to public endpoint if admin fetch fails or returns non-200
      const pubRes = await apiFetch(`/api/products?limit=1000`, { headers: getHeaders() });
      if (!pubRes.ok) {
        console.warn(`[getProducts] HTTP ${pubRes.status}`);
        return [];
      }
      const pubData = await pubRes.json();
      return pubData.products || [];
    }

    const data = await res.json();
    return data.products || [];
  } catch (e) {
    console.error("Error fetching products:", e);
    return [];
  }
}

export async function getFilteredProducts(options: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  schoolLevel?: string;
  sortBy?: string;
}): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
  const cleanParams: Record<string, string> = {
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
  };

  if (options.search?.trim()) cleanParams.search = options.search.trim();
  if (options.category?.trim()) cleanParams.category = options.category.trim();
  if (options.minPrice !== undefined && !Number.isNaN(options.minPrice)) cleanParams.minPrice = String(options.minPrice);
  if (options.maxPrice !== undefined && !Number.isNaN(options.maxPrice)) cleanParams.maxPrice = String(options.maxPrice);
  if (options.brand?.trim()) cleanParams.brand = options.brand.trim();
  if (options.schoolLevel?.trim()) cleanParams.schoolLevel = options.schoolLevel.trim();
  if (options.sortBy?.trim()) cleanParams.sortBy = options.sortBy.trim();

  const params = new URLSearchParams(cleanParams);

  try {
    const res = await apiFetch(`/api/products?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[getFilteredProducts] Failed with HTTP ${res.status}:`, errText);
      return {
        products: [],
        pagination: { page: options.page ?? 1, limit: options.limit ?? 20, total: 0, pages: 1 },
      };
    }

    const data = await res.json();
    return {
      products: Array.isArray(data.products) ? data.products : [],
      pagination: data.pagination ?? { page: 1, limit: 20, total: 0, pages: 1 },
    };
  } catch (e) {
    console.error('Error fetching filtered products:', e);
    return {
      products: [],
      pagination: { page: options.page ?? 1, limit: options.limit ?? 20, total: 0, pages: 1 },
    };
  }
}


export async function getProductById(id: number | string): Promise<Product | null> {
  try {
    const res = await fetchWithAuth(`/api/products/${encodeURIComponent(String(id))}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch product");
    }
    const data = await res.json();
    return data.product || null;
  } catch (e) {
    console.error("Error fetching product:", e);
    return null;
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const res = await fetchWithAuth(`/api/categories`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json();
    return Array.isArray(data.categories) ? data.categories : [];
  } catch (e) {
    console.error("Error fetching categories:", e);
    return [];
  }
}

export async function getAdminCategories(): Promise<string[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/categories`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const parsed = await parseJSONSafe(res);
      const msg = parsed && (parsed.error || parsed.__rawText) ? (parsed.error || parsed.__rawText) : 'Failed to fetch admin categories';
      throw new Error(String(msg));
    }
    const data = await parseJSONSafe(res);
    if (!data) return [];
    if (Array.isArray((data as any).categories)) return (data as any).categories;
    if ((data as any).__rawText) throw new Error((data as any).__rawText);
    return [];
  } catch (e) {
    console.error("Error fetching admin categories:", e);
    return [];
  }
}

export async function addCategory(category: string): Promise<string[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/categories`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ category }),
    });
    if (!res.ok) {
      const parsed = await parseJSONSafe(res);
      const msg = parsed && (parsed.error || parsed.__rawText) ? (parsed.error || parsed.__rawText) : 'Failed to add category';
      throw new Error(String(msg));
    }
    const data = await parseJSONSafe(res);
    if (!data) return [];
    if (Array.isArray((data as any).categories)) return (data as any).categories;
    if ((data as any).__rawText) throw new Error((data as any).__rawText);
    return [];
  } catch (e) {
    console.error("Error adding category:", e);
    throw e;
  }
}

export async function deleteCategory(category: string): Promise<string[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/categories/${encodeURIComponent(category)}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const parsed = await parseJSONSafe(res);
      const msg = parsed && (parsed.error || parsed.__rawText) ? (parsed.error || parsed.__rawText) : 'Failed to delete category';
      throw new Error(String(msg));
    }
    const data = await parseJSONSafe(res);
    if (!data) return [];
    if (Array.isArray((data as any).categories)) return (data as any).categories;
    if ((data as any).__rawText) throw new Error((data as any).__rawText);
    return [];
  } catch (e) {
    console.error("Error deleting category:", e);
    throw e;
  }
}

export async function addProduct(product: Omit<Product, "id">): Promise<Product[]> {
  try {
    const res = await fetchWithAuth("/api/admin/products", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to add product");
    }
    return getProducts();
  } catch (e) {
    console.error("Error adding product:", e);
    throw e;
  }
}

export async function updateProduct(
  id: Product["id"],
  updates: Partial<Omit<Product, "id">>,
): Promise<Product[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update product");
    }
    return getProducts();
  } catch (e) {
    console.error("Error updating product:", e);
    throw e;
  }
}

export async function deleteProduct(id: Product["id"]): Promise<Product[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/products/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete product");
    }
    return getProducts();
  } catch (e) {
    console.error("Error deleting product:", e);
    throw e;
  }
}

export async function getAuditEntries(limit = 50): Promise<any[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/audit?limit=${limit}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch audit entries");
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : [];
  } catch (e) {
    console.error("Error fetching audit entries:", e);
    return [];
  }
}

// ── Admin Stats ──────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats | null> {
  try {
    const res = await fetchWithAuth('/api/admin/stats', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  } catch (e) {
    console.error('Error fetching admin stats:', e);
    return null;
  }
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(page = 1, limit = 20, search = ''): Promise<User[]> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(search && { search }) });
    const res = await fetchWithAuth(`/api/admin/users?${params}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    return data.users || [];
  } catch (e) {
    console.error("Error fetching users:", e);
    return [];
  }
}

export async function getUserById(id: string): Promise<{ user: User; orders: Order[] } | null> {
  try {
    const res = await fetchWithAuth(`/api/admin/users/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  } catch (e) {
    console.error('Error fetching user:', e);
    return null;
  }
}

export async function blockUser(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/admin/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ isBlocked: true }),
  });
  if (!res.ok) throw new Error('Failed to block user');
}

export async function unblockUser(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/admin/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ isBlocked: false }),
  });
  if (!res.ok) throw new Error('Failed to unblock user');
}

export async function deleteUser(id: User["id"]): Promise<User[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete user");
    }
    return getUsers();
  } catch (e) {
    console.error("Error deleting user:", e);
    throw e;
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function register(user: Omit<User, "id">): Promise<User> {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const parsed = await parseJSONSafe(res);
    const msg = parsed && (parsed.error || parsed.__rawText) ? (parsed.error || parsed.__rawText) : 'Failed to register';
    throw new Error(String(msg));
  }
  const data = await res.json();
  if (res.ok) {
    if (data.user) {
      localStorage.setItem(KEYS.currentUser, JSON.stringify(data.user));
      localStorage.setItem(KEYS.isAdmin, String(data.user.statut === "admin"));
    }
  }
  return data ? (data as any).user : Promise.reject(new Error('Empty response from server'));
}

export async function login(email: string, password: string, code?: string, tempToken?: string): Promise<any> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, code, tempToken }),
  });
  if (!res.ok) {
    const parsed = await parseJSONSafe(res);
    const msg = parsed && (parsed.error || parsed.__rawText) ? (parsed.error || parsed.__rawText) : 'Failed to login';
    throw new Error(String(msg));
  }
  const data = await parseJSONSafe(res);
  if (data && (data as any).require2FA) {
    return data; // Return 2FA requirement info
  }
  if (res.ok && data && (data as any).user) {
    localStorage.setItem(KEYS.currentUser, JSON.stringify((data as any).user));
    localStorage.setItem(KEYS.isAdmin, String((data as any).user.statut === "admin"));
    const token = (data as any).token || (data as any).accessToken;
    if (token) {
      localStorage.setItem(KEYS.token, token);
      localStorage.setItem("ecolier_token", token);
    }
  }
  return data ? (data as any).user : Promise.reject(new Error('Empty response from server'));
}

export async function emailExists(email: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/auth/check-email/${encodeURIComponent(email)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.exists;
  } catch (e) {
    return false;
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await apiFetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const parsed = await parseJSONSafe(res);
    const msg = parsed && (parsed.error || parsed.__rawText) ? (parsed.error || parsed.__rawText) : 'Failed to send reset email';
    throw new Error(String(msg));
  }
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
  const res = await apiFetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, password: newPassword }),
  });
  if (!res.ok) {
    const parsed = await parseJSONSafe(res);
    const msg = parsed && (parsed.error || parsed.__rawText) ? (parsed.error || parsed.__rawText) : 'Failed to reset password';
    throw new Error(String(msg));
  }
}

// ── Current user session ─────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(KEYS.currentUser);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: User): void {
  localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem(KEYS.currentUser);
  localStorage.removeItem(KEYS.isAdmin);
  localStorage.removeItem(KEYS.cart);
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(page = 1, limit = 1000, search = '', status = ''): Promise<Order[]> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status })
    });
    const res = await fetchWithAuth(`/api/admin/orders?${params}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch orders");
    const data = await res.json();
    return (data.orders || []).map((o: any) => ({ ...o, id: o.id || o._id }));
  } catch (e) {
    console.error("Error fetching orders:", e);
    return [];
  }
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  try {
    const res = await fetchWithAuth(`/api/orders/user/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch user orders");
    const data = await res.json();
    return (data.orders || []).map((o: any) => ({ ...o, id: o.id || o._id }));
  } catch (e) {
    console.error("Error fetching user orders:", e);
    return [];
  }
}

export async function createOrder(order: Omit<Order, "id" | "date">): Promise<Order[]> {
  try {
    const res = await fetchWithAuth("/api/orders", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error("Failed to create order");
    // Return empty list or reload if needed (storefront clears cart anyway)
    return [];
  } catch (e) {
    console.error("Error creating order:", e);
    return [];
  }
}

export async function updateOrder(
  id: Order["id"],
  updates: Partial<Omit<Order, "id">>,
): Promise<Order[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update order");
    }
    return getOrders();
  } catch (e) {
    console.error("Error updating order:", e);
    throw e;
  }
}

export async function updateOrderStatus(id: string, status: string): Promise<{ status: string; paymentStatus: string }> {
  const res = await fetchWithAuth(`/api/admin/orders/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update order status');
  }
  const data = await res.json().catch(() => ({}));
  return { status: data.status || status, paymentStatus: data.paymentStatus || 'pending' };
}

export async function updateOrderPayment(id: string, paymentStatus: string): Promise<void> {
  const res = await fetchWithAuth(`/api/admin/orders/${id}/payment`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ paymentStatus }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update payment status');
  }
}

export async function deleteOrder(id: Order["id"]): Promise<Order[]> {
  try {
    const res = await fetchWithAuth(`/api/admin/orders/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete order");
    }
    return getOrders();
  } catch (e) {
    console.error("Error deleting order:", e);
    throw e;
  }
}

// ── Admin flag ──────────────────────────────────────────────────────────────────

export function getIsAdmin(): boolean {
  return localStorage.getItem(KEYS.isAdmin) === "true";
}

export function setIsAdmin(value: boolean): void {
  localStorage.setItem(KEYS.isAdmin, String(value));
}

// ── Brands ──────────────────────────────────────────────────────────────────

export async function getBrands(): Promise<Brand[]> {
  try {
    const res = await apiFetch('/api/brands', { headers: getHeaders() });
    if (!res.ok) {
      console.warn(`[getBrands] HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.brands || [];
  } catch (e) {
    console.error('Error fetching brands:', e);
    return [];
  }
}

export async function createBrand(data: Omit<Brand, '_id' | 'id' | 'createdAt'>): Promise<void> {
  const res = await apiFetch('/api/admin/brands', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create brand');
  }
}

export async function updateBrand(id: string, data: Partial<Brand>): Promise<void> {
  const res = await apiFetch(`/api/admin/brands/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update brand');
  }
}

export async function deleteBrand(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/brands/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete brand');
  }
}

// ── Coupons (Codes Promo) ──────────────────────────────────────────────

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const res = await apiFetch('/api/admin/coupons', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch coupons');
    const data = await res.json();
    return data.coupons || [];
  } catch (e) {
    console.error('Error fetching coupons:', e);
    return [];
  }
}

export async function createCoupon(data: Omit<Coupon, '_id' | 'id' | 'createdAt'>): Promise<void> {
  const res = await apiFetch('/api/admin/coupons', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create coupon');
  }
}

export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<void> {
  const res = await apiFetch(`/api/admin/coupons/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update coupon');
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/coupons/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete coupon');
  }
}

export async function validateCoupon(code: string, cartTotal: number): Promise<{ valid: boolean; discountAmount?: number; error?: string }> {
  try {
    const res = await apiFetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, cartTotal }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { valid: false, error: err.error || 'Code promo invalide.' };
    }
    const data = await res.json();
    return { valid: data.valid, discountAmount: data.discountAmount, error: data.error };
  } catch (e) {
    console.error('Error validating coupon:', e);
    return { valid: false, error: 'Erreur lors de la validation du code promo.' };
  }
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviews(page = 1, limit = 20, search = ''): Promise<{ reviews: Review[]; total: number; pages: number }> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(search && { search }) });
    const res = await apiFetch(`/api/admin/reviews?${params}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reviews');
    const data = await res.json();
    return { reviews: data.reviews || [], total: data.pagination?.total || 0, pages: data.pagination?.pages || 1 };
  } catch (e) {
    console.error('Error fetching reviews:', e);
    return { reviews: [], total: 0, pages: 1 };
  }
}

export async function deleteReview(id: string): Promise<void> {
  const res = await apiFetch(`/api/admin/reviews/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete review');
  }
}

// ── Dynamic Layout Settings (MongoDB-backed) ─────────────────────────────────

/**
 * Fetch all dynamic layout blocks from the backend.
 * Returns a plain Record<key, content> so callers do:
 *   const { layout } = useLayout();
 *   const nav = layout["navbar"]; // whatever shape was stored
 */
export async function getLayoutSettings(): Promise<Record<string, any>> {
  try {
    const res = await apiFetch("/api/settings");
    if (!res.ok) throw new Error("Failed to fetch layout settings");
    const data = await res.json();
    // Backend returns { settings: { key: content, … } }
    return data.settings || {};
  } catch (e) {
    console.error("Error fetching layout settings:", e);
    return {};
  }
}

/**
 * Upsert a single layout block.
 * The admin can pass any JSON shape as `content`.
 *   key     – e.g. "navbar", "hero", "promo_banner"
 *   content – any JSON (array of links, object, string, …)
 */
export async function updateLayoutSetting(key: string, content: any): Promise<void> {
  const res = await apiFetch(`/api/settings/${key}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(content),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save setting");
  }
}

// ── Settings (localStorage-based legacy) ─────────────────────────────────────


export interface SiteSettings {
  siteName: string;
  siteEmail: string;
  sitePhone: string;
  siteAddress: string;
  currency: string;
  taxRate: string;
  shippingFee: string;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "L'Écolier",
  siteEmail: 'contact@lecolier.tn',
  sitePhone: '+216 58 982 121',
  siteAddress: 'Tunisie',
  currency: 'DT',
  taxRate: '19',
  shippingFee: '7',
  maintenanceMode: false
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const res = await apiFetch("/api/settings/site_settings", { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch settings");
    const data = await res.json();
    if (data && data.content) {
      return { ...DEFAULT_SETTINGS, ...data.content };
    }
    return DEFAULT_SETTINGS;
  } catch (e) {
    console.error("Error fetching settings:", e);
    try {
      const raw = localStorage.getItem('ecolier_settings');
      return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  try {
    const res = await apiFetch("/api/settings/site_settings", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to save settings");
    }
    localStorage.setItem('ecolier_settings', JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving settings:", e);
    localStorage.setItem('ecolier_settings', JSON.stringify(settings));
  }
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export function getCart<T>(): T[] {
  try {
    const raw = localStorage.getItem(KEYS.cart);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function saveCart<T>(cart: T[]): void {
  localStorage.setItem(KEYS.cart, JSON.stringify(cart));
}

// ── Public Storefront Order ───────────────────────────────────────────────────
// This is the ONLY correct way for customers to place orders.
// The backend computes prices; the client only sends product identifiers + quantities.

export interface PublicOrderPayload {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerGovernorate: string;
  customerEmail?: string;
  userId?: string;
  items: Array<{ productId: number | string; quantity: number }>;
  paymentMethod?: string;
  deliveryNotes?: string;
}

export interface PublicOrderResult {
  orderId: string;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}

/**
 * Place a customer order via the public API.
 * Prices are computed server-side — never trust client-sent totals.
 * Throws on network or validation errors (propagates to useCheckout).
 */
export async function createPublicOrder(payload: PublicOrderPayload): Promise<PublicOrderResult> {
  const res = await apiFetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const parsed = await parseJSONSafe(res);
    const msg =
      parsed && (parsed.error || parsed.__rawText)
        ? String(parsed.error || parsed.__rawText)
        : 'Échec de la création de la commande.';
    throw new Error(msg);
  }

  return res.json();
}

// ── Remembered email ─────────────────────────────────────────────────────────

export function getRememberedEmail(): string | null {
  return localStorage.getItem(KEYS.rememberedEmail);
}

export function setRememberedEmail(email: string | null): void {
  if (email) localStorage.setItem(KEYS.rememberedEmail, email);
  else localStorage.removeItem(KEYS.rememberedEmail);
}

// ── Wishlist ─────────────────────────────────────────────────────────────────

export async function getWishlist(): Promise<{ wishlist: Product[]; wishlistIds: (string | number)[] }> {
  try {
    const res = await fetchWithAuth('/api/wishlist', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch wishlist');
    const data = await res.json();
    return {
      wishlist: Array.isArray(data.wishlist) ? data.wishlist : [],
      wishlistIds: Array.isArray(data.wishlistIds) ? data.wishlistIds : [],
    };
  } catch (e) {
    console.error('Error fetching user wishlist:', e);
    return { wishlist: [], wishlistIds: [] };
  }
}

export async function toggleWishlistApi(productId: string | number): Promise<{ success: boolean; wishlistIds: (string | number)[]; wishlist: Product[]; isWishlisted: boolean }> {
  try {
    const res = await fetchWithAuth('/api/wishlist/toggle', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) throw new Error('Failed to toggle wishlist item');
    return res.json();
  } catch (e) {
    console.error('Error toggling wishlist:', e);
    throw e;
  }
}

export async function removeFromWishlistApi(productId: string | number): Promise<{ success: boolean; wishlistIds: (string | number)[] }> {
  try {
    const res = await fetchWithAuth(`/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove wishlist item');
    return res.json();
  } catch (e) {
    console.error('Error removing from wishlist:', e);
    throw e;
  }
}

export async function getBatchWishlistApi(productIds: (string | number)[]): Promise<Product[]> {
  if (!productIds || productIds.length === 0) return [];
  try {
    const res = await apiFetch('/api/wishlist/batch', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productIds }),
    });
    if (!res.ok) throw new Error('Failed to fetch batch wishlist');
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : [];
  } catch (e) {
    console.error('Error fetching batch wishlist:', e);
    return [];
  }
}