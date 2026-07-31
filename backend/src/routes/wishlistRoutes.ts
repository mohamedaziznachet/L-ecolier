import express from 'express';
import type { Request, Response } from 'express';
import { UserModel, ProductModel } from '../models/index.ts';
import { authenticate } from '../middleware/auth.ts';
import { buildProductLookupQuery } from '../repositories/productRepository.ts';

const router = express.Router();

/**
 * GET /api/wishlist
 * Returns list of wishlisted products for authenticated user.
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester || !requester.userId) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    const user = await UserModel.findById(requester.userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const wishlistIds = user.wishlist || [];
    if (wishlistIds.length === 0) {
      return res.json({ wishlist: [], wishlistIds: [] });
    }

    // Build OR condition for all product IDs
    const conditions = wishlistIds.map((id: any) => buildProductLookupQuery(id));
    const products = await ProductModel.find({ $or: conditions, status: 'active' }).lean();

    return res.json({ wishlist: products, wishlistIds });
  } catch (err) {
    console.error('[Wishlist] Error fetching wishlist:', err);
    return res.status(500).json({ error: 'Échec de la récupération de la liste d\'envies.' });
  }
});

/**
 * POST /api/wishlist/toggle
 * Toggle product in user's wishlist array
 */
router.post('/toggle', authenticate, async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester || !requester.userId) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'ID produit requis.' });
    }

    const user = await UserModel.findById(requester.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    let wishlist = user.wishlist || [];
    const normId = String(productId);
    const existingIndex = wishlist.findIndex((id: any) => String(id) === normId);

    if (existingIndex > -1) {
      // Remove
      wishlist.splice(existingIndex, 1);
    } else {
      // Add
      wishlist.push(productId);
    }

    user.wishlist = wishlist;
    await user.save();

    // Fetch full wishlist items
    let products: any[] = [];
    if (wishlist.length > 0) {
      const conditions = wishlist.map((id: any) => buildProductLookupQuery(id));
      products = await ProductModel.find({ $or: conditions, status: 'active' }).lean();
    }

    return res.json({
      success: true,
      wishlistIds: user.wishlist,
      wishlist: products,
      isWishlisted: existingIndex === -1
    });
  } catch (err) {
    console.error('[Wishlist] Error toggling wishlist item:', err);
    return res.status(500).json({ error: 'Échec de la mise à jour de la liste d\'envies.' });
  }
});

/**
 * DELETE /api/wishlist/:productId
 * Remove product from user's wishlist
 */
router.delete('/:productId', authenticate, async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester || !requester.userId) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    const { productId } = req.params;
    const user = await UserModel.findById(requester.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const normId = String(productId);
    user.wishlist = (user.wishlist || []).filter((id: any) => String(id) !== normId);
    await user.save();

    return res.json({ success: true, wishlistIds: user.wishlist });
  } catch (err) {
    console.error('[Wishlist] Error deleting wishlist item:', err);
    return res.status(500).json({ error: 'Échec de la suppression de la liste d\'envies.' });
  }
});

/**
 * POST /api/wishlist/batch
 * Given an array of product IDs (e.g. from guest localStorage), return the product documents.
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.json({ products: [] });
    }

    const conditions = productIds.map((id: any) => buildProductLookupQuery(id));
    const products = await ProductModel.find({ $or: conditions, status: 'active' }).lean();
    return res.json({ products });
  } catch (err) {
    console.error('[Wishlist] Error fetching batch wishlist:', err);
    return res.status(500).json({ error: 'Échec de la récupération des produits.' });
  }
});

export default router;
