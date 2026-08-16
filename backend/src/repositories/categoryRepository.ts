// server/src/repositories/categoryRepository.ts
// Categories repository — MongoDB only, no JSON file fallback.
// MongoDB is the single source of truth.

import { CategoryModel } from '../models/index.ts';

const DEFAULT_CATEGORIES = [
  'Cartable Lux',
  'Cartable Eco Lux',
  'Cartable super lux',
  'Cartable high lux',
  'Trousse',
  'Lunch box',
  'Chariots',
  'Sacs à dos',
  'Cahiers & Classeurs',
  'Stylos & Crayons',
  'Calculatrices',
  'Matériel artistique',
  'Papeterie',
  'Fournitures scolaires',
];

function normalizeCategory(value: any): string {
  return String(value ?? '').trim().replace(/Catrable/gi, 'Cartable');
}

/**
 * Seed default categories if the collection is empty.
 * Called once on first access.
 */
async function seedDefaultsIfEmpty(): Promise<void> {
  const count = await CategoryModel.countDocuments();
  if (count === 0) {
    const docs = DEFAULT_CATEGORIES.map((name) => ({ name }));
    await CategoryModel.insertMany(docs, { ordered: false }).catch(() => {
      // Ignore duplicate key errors from concurrent seeds
    });
  }
}

/**
 * Get all saved categories, sorted alphabetically.
 * Throws on database error.
 */
export async function getSavedCategories(): Promise<string[]> {
  await seedDefaultsIfEmpty();
  const categories = await CategoryModel.find().sort({ name: 1 }).lean();
  return categories.map((c: any) => c.name);
}

/**
 * Add a new category.
 * Returns the updated list of all categories.
 * Throws on invalid input or database error.
 */
export async function addCategory(category: string): Promise<string[]> {
  const normalized = normalizeCategory(category);
  if (!normalized) {
    throw new Error('Categorie invalide');
  }

  try {
    await CategoryModel.create({ name: normalized });
  } catch (err: any) {
    // Duplicate key — category already exists; not a fatal error
    if (err.code !== 11000) {
      throw err;
    }
  }

  return getSavedCategories();
}

/**
 * Delete a category by name.
 * Returns the updated list of all categories.
 * Throws on database error.
 */
export async function deleteCategory(category: string): Promise<string[]> {
  const normalized = normalizeCategory(category);
  await CategoryModel.deleteOne({ name: normalized });
  return getSavedCategories();
}

/**
 * Reset all categories back to default seed list.
 */
export async function resetCategories(): Promise<string[]> {
  await CategoryModel.deleteMany({});
  const docs = DEFAULT_CATEGORIES.map((name) => ({ name }));
  await CategoryModel.insertMany(docs, { ordered: false }).catch(() => {});
  return getSavedCategories();
}

/**
 * Get all category documents with subcategories.
 */
export async function getCategoriesWithSubcategories(): Promise<any[]> {
  await seedDefaultsIfEmpty();
  return CategoryModel.find().sort({ name: 1 }).lean();
}

/**
 * Add a subcategory to a category.
 */
export async function addSubCategory(categoryName: string, subName: string): Promise<any[]> {
  const normCat = normalizeCategory(categoryName);
  const normSub = String(subName ?? '').trim();
  if (!normCat || !normSub) throw new Error('Catégorie ou sous-catégorie invalide');

  await CategoryModel.updateOne(
    { name: normCat },
    { $addToSet: { subcategories: { name: normSub, image: '' } } },
    { upsert: true }
  );

  return getCategoriesWithSubcategories();
}

/**
 * Delete a subcategory from a category.
 */
export async function deleteSubCategory(categoryName: string, subName: string): Promise<any[]> {
  const normCat = normalizeCategory(categoryName);
  const normSub = String(subName ?? '').trim();
  if (!normCat || !normSub) throw new Error('Catégorie ou sous-catégorie invalide');

  await CategoryModel.updateOne(
    { name: normCat },
    { $pull: { subcategories: { name: normSub } } }
  );

  return getCategoriesWithSubcategories();
}
