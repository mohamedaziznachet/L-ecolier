// server/src/repositories/productRepository.ts
// Products repository — MongoDB only, no JSON file fallback.
// MongoDB is the single source of truth.
// If the database is unavailable, operations throw — callers return 503.

import mongoose from 'mongoose';
import { connectDB } from '../config/db.ts';
import { ProductModel } from '../models/index.ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

function coerceProductId(value: any): number | string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const numericValue = Number(trimmed);
    if (!Number.isNaN(numericValue) && String(numericValue) === trimmed) {
      return numericValue;
    }
  }

  return value;
}

/**
 * Build a MongoDB query that can find a product by either:
 * - Its numeric `id` field
 * - Its MongoDB ObjectId `_id`
 */
export function buildProductLookupQuery(identifier: string | number): object {
  const normalizedIdentifier = String(identifier).trim();
  const numericIdentifier = Number(normalizedIdentifier);
  const conditions: object[] = [];

  if (!Number.isNaN(numericIdentifier) && String(numericIdentifier) === normalizedIdentifier) {
    conditions.push({ id: numericIdentifier });
  }

  if (mongoose.Types.ObjectId.isValid(normalizedIdentifier)) {
    conditions.push({ _id: normalizedIdentifier });
  }

  // Fallback if neither a valid number nor a valid ObjectId
  if (conditions.length === 0) {
    return { _id: null };
  }

  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}

function normalizeProduct(product: any): any {
  const normalized = {
    ...product,
    id: coerceProductId(product.id ?? product._id?.toString?.() ?? Date.now()),
    name: product.name ?? 'Produit sans nom',
    price: product.price ?? '0 DT',
    priceNum: Number(product.priceNum ?? 0),
    priceBeforeDiscount: product.priceBeforeDiscount !== undefined && product.priceBeforeDiscount !== null && product.priceBeforeDiscount !== '' ? Number(product.priceBeforeDiscount) : null,
    discount: Number(product.discount ?? 0),
    oldPrice: product.oldPrice ?? null,
    schoolLevel: product.schoolLevel ?? null,
    badge: product.badge ?? null,
    badgeColor: product.badgeColor ?? null,
    rating: Number(product.rating ?? 5),
    reviews: Number(product.reviews ?? 0),
    img: product.img ?? product.images?.[0] ?? '',
    images: Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.img
        ? [product.img]
        : [],
    category: String(product.category ?? 'Autre').replace(/Catrable/gi, 'Cartable'),
    brand: product.brand ?? '',
    description: product.description ?? '',
    stock: Number(product.stock ?? 0),
    availability: product.availability ?? 'En stock',
    featured: Boolean(product.featured ?? false),
    status: product.status ?? 'active',
    specifications: Array.isArray(product.specifications)
      ? product.specifications.map((s: any) => ({
          key: String(s.key || s.name || s.label || '').trim(),
          value: String(s.value || s.val || '').trim()
        })).filter((s: any) => s.key || s.value)
      : [],
  };

  if (!normalized.images.includes(normalized.img) && normalized.img) {
    normalized.images = [normalized.img, ...normalized.images.filter(Boolean)];
  }

  return normalized;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get all products, sorted by numeric id ascending.
 * Throws if MongoDB is unavailable.
 */
export async function getAllProducts(): Promise<any[]> {
  const products = await ProductModel.find().sort({ id: 1 }).lean();
  return products.map((product) => normalizeProduct(product));
}

import { getSavedCategories } from './categoryRepository.ts';

/**
 * Get distinct category names from products + saved categories.
 * Throws if MongoDB is unavailable.
 */
export async function getCategories(): Promise<string[]> {
  const distinctFromProducts = await ProductModel.distinct('category');
  let savedCategories: string[] = [];
  try {
    savedCategories = await getSavedCategories();
  } catch (err) {
    console.error('Failed to fetch saved categories:', err);
  }
  const set = new Set([
    ...distinctFromProducts.filter(Boolean),
    ...savedCategories.filter(Boolean)
  ]);
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}

/**
 * Insert a new product into MongoDB.
 * Returns the MongoDB `_id` string of the created document.
 * Throws if MongoDB is unavailable or validation fails.
 */
export async function insertProduct(productData: any): Promise<string> {
  const payload = normalizeProduct({
    ...productData,
    id: productData.id ?? Date.now() + Math.floor(Math.random() * 1000),
  });

  const saved = await ProductModel.create(payload);
  return saved._id.toString();
}

/**
 * Update a product by numeric id or MongoDB ObjectId.
 * Returns the normalized updated product, or null if not found.
 * Throws if MongoDB is unavailable.
 */
export async function updateProduct(identifier: string | number, updates: any): Promise<any | null> {
  const payload = normalizeProduct({ ...updates, id: updates.id ?? identifier });
  delete payload._id;
  delete payload.__v;
  const query = buildProductLookupQuery(identifier);
  const updated = await ProductModel.findOneAndUpdate(
    query,
    { $set: payload },
    { new: true, runValidators: true }
  );
  return updated ? normalizeProduct(updated) : null;
}

/**
 * Delete a product by numeric id or MongoDB ObjectId.
 * Returns the normalized deleted product, or null if not found.
 * Throws if MongoDB is unavailable.
 */
export async function deleteProduct(identifier: string | number): Promise<any | null> {
  const query = buildProductLookupQuery(identifier);
  const deleted = await ProductModel.findOneAndDelete(query);
  return deleted ? normalizeProduct(deleted) : null;
}

/**
 * Returns the raw Mongoose db connection (used by legacy callers).
 * Throws if unable to connect.
 */
export async function getDb() {
  await connectDB();
  return mongoose.connection.db!;
}
