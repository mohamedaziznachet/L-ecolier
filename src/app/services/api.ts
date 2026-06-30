// Data-access / service layer.
//
// Every interaction with the persistence backend goes through this module.
// Today it is backed by `localStorage`, preserving the exact keys/behaviour the
// app relied on before. Swapping in a real backend later only requires changing
// the implementations here -- the rest of the app keeps calling these functions.

import { Product, User, Order } from "../types";
import { catalogProducts } from "../components/utils/products";

const KEYS = {
  // Single source of truth for users: the key the storefront signup has always
  // used. The admin panel now reads/writes the same key.
  users: "ecolier_users",
  // Single catalog source for both storefront and admin CRUD.
  products: "admin_products",
  orders: "admin_orders",
  currentUser: "ecolier_user",
  cart: "ecolier_cart",
  isAdmin: "admin_isAdmin",
  rememberedEmail: "ecolier_remembered_email",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.error(`Error reading "${key}" from storage:`, e);
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const genStringId = (): string => "_" + Math.random().toString(36).substr(2, 9);
const genNumericId = (): number => Date.now() + Math.floor(Math.random() * 1000);

// ── Products ─────────────────────────────────────────────────────────────────

export function getProducts(): Product[] {
  let products = read<Product[]>(KEYS.products, []);
  // Seed the store from the static catalog the first time it's empty so the
  // storefront and admin share the same product list from the start.
  if (!products || products.length === 0) {
    products = catalogProducts;
    write(KEYS.products, products);
  }
  return products;
}

export function addProduct(product: Omit<Product, "id">): Product[] {
  const products = [...getProducts(), { ...product, id: genNumericId() }];
  write(KEYS.products, products);
  return products;
}

export function updateProduct(
  id: Product["id"],
  updates: Partial<Omit<Product, "id">>,
): Product[] {
  const products = getProducts().map((p) => (p.id === id ? { ...p, ...updates } : p));
  write(KEYS.products, products);
  return products;
}

export function deleteProduct(id: Product["id"]): Product[] {
  const products = getProducts().filter((p) => p.id !== id);
  write(KEYS.products, products);
  return products;
}

// ── Users ────────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  const users = read<User[]>(KEYS.users, []);
  // Backfill ids for any legacy signup records that were stored without one,
  // so the admin panel always has a stable id to key off of.
  let mutated = false;
  const normalized = users.map((u) => {
    if (!u.id) {
      mutated = true;
      return { ...u, id: genStringId() };
    }
    return u;
  });
  if (mutated) write(KEYS.users, normalized);
  return normalized;
}

export function addUser(user: Omit<User, "id">): User[] {
  const users = [...getUsers(), { ...user, id: genStringId() }];
  write(KEYS.users, users);
  return users;
}

export function updateUser(
  id: User["id"],
  updates: Partial<Omit<User, "id">>,
): User[] {
  const users = getUsers().map((u) => (u.id === id ? { ...u, ...updates } : u));
  write(KEYS.users, users);
  return users;
}

export function deleteUser(id: User["id"]): User[] {
  const users = getUsers().filter((u) => u.id !== id);
  write(KEYS.users, users);
  return users;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export function register(user: Omit<User, "id">): User {
  const newUser: User = { ...user, id: genStringId() };
  const users = [...getUsers(), newUser];
  write(KEYS.users, users);
  return newUser;
}

export function login(email: string, password: string): User | null {
  const users = getUsers();
  return (
    users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    ) || null
  );
}

export function emailExists(email: string): boolean {
  return getUsers().some((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function resetPassword(email: string, newPassword: string): void {
  const users = getUsers().map((u) =>
    u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: newPassword } : u,
  );
  write(KEYS.users, users);
}

// ── Current user session ─────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  return read<User | null>(KEYS.currentUser, null);
}

export function saveCurrentUser(user: User): void {
  write(KEYS.currentUser, user);
}

export function logout(): void {
  localStorage.removeItem(KEYS.currentUser);
}

// ── Orders ───────────────────────────────────────────────────────────────────

export function getOrders(): Order[] {
  return read<Order[]>(KEYS.orders, []);
}

export function createOrder(order: Omit<Order, "id">): Order[] {
  const orders = [...getOrders(), { ...order, id: genStringId() }];
  write(KEYS.orders, orders);
  return orders;
}

export function updateOrder(
  id: Order["id"],
  updates: Partial<Omit<Order, "id">>,
): Order[] {
  const orders = getOrders().map((o) => (o.id === id ? { ...o, ...updates } : o));
  write(KEYS.orders, orders);
  return orders;
}

export function deleteOrder(id: Order["id"]): Order[] {
  const orders = getOrders().filter((o) => o.id !== id);
  write(KEYS.orders, orders);
  return orders;
}

// ── Admin flag ───────────────────────────────────────────────────────────────

export function getIsAdmin(): boolean {
  return localStorage.getItem(KEYS.isAdmin) === "true";
}

export function setIsAdmin(value: boolean): void {
  localStorage.setItem(KEYS.isAdmin, String(value));
}

// ── Cart ─────────────────────────────────────────────────────────────────────

export function getCart<T>(): T[] {
  return read<T[]>(KEYS.cart, []);
}

export function saveCart<T>(cart: T[]): void {
  write(KEYS.cart, cart);
}

// ── Remembered email ─────────────────────────────────────────────────────────

export function getRememberedEmail(): string | null {
  return localStorage.getItem(KEYS.rememberedEmail);
}

export function setRememberedEmail(email: string | null): void {
  if (email) localStorage.setItem(KEYS.rememberedEmail, email);
  else localStorage.removeItem(KEYS.rememberedEmail);
}
