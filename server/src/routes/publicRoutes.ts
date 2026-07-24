import express from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { ProductModel, OrderModel, PageSettingsModel, BrandModel } from '../models/index.ts';
import { getCategories, buildProductLookupQuery } from '../repositories/productRepository.ts';
import { validateCoupon } from '../repositories/couponRepository.ts';
import { authenticateAdmin, authenticate } from '../middleware/auth.ts';

const router = express.Router();

function makeFlexibleRegex(text: string): RegExp {
  let sanitized = text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  sanitized = sanitized.replace(/cartable|catrable/gi, '(?:cartable|catrable)');
  const accentFlex = sanitized
    .replace(/[aàáâä]/gi, '[aàáâä]')
    .replace(/[eèéêë]/gi, '[eèéêë]')
    .replace(/[iìíîï]/gi, '[iìíîï]')
    .replace(/[oòóôö]/gi, '[oòóôö]')
    .replace(/[uùúûü]/gi, '[uùúûü]')
    .replace(/[cç]/gi, '[cç]')
    .replace(/\s+/g, '[-_\\s]+');
  return new RegExp(accentFlex, 'i');
}

// Get filtered products (public storefront)
router.get('/products', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20);
    const search = String(req.query.search ?? '').trim();
    const category = String(req.query.category ?? '').trim();
    const minPriceRaw = req.query.minPrice;
    const minPrice = minPriceRaw === undefined || minPriceRaw === '' ? undefined : Number(minPriceRaw);
    const maxPriceRaw = req.query.maxPrice;
    const maxPrice = maxPriceRaw === undefined || maxPriceRaw === '' ? undefined : Number(maxPriceRaw);
    const brand = String(req.query.brand ?? '').trim();
    const schoolLevel = String(req.query.schoolLevel ?? '').trim();
    const sortBy = String(req.query.sortBy ?? 'default');

    // Build MongoDB filter
    const conditions: any[] = [
      { status: { $ne: 'inactive' } }
    ];

    if (category) {
      const parts = category.split('&').map(p => p.trim()).filter(Boolean);
      const catOrConditions: any[] = [];
      for (const part of parts) {
        const catRegex = makeFlexibleRegex(part);
        catOrConditions.push(
          { category: catRegex },
          { brand: catRegex },
          { name: catRegex },
          { description: catRegex },
          { schoolLevel: catRegex }
        );
      }
      conditions.push({ $or: catOrConditions });
    }

    if (brand) {
      const brandRegex = makeFlexibleRegex(brand);
      conditions.push({
        $or: [
          { brand: brandRegex },
          { name: brandRegex }
        ]
      });
    }

    if (schoolLevel) {
      const schoolRegex = makeFlexibleRegex(schoolLevel);
      conditions.push({
        $or: [
          { schoolLevel: schoolRegex },
          { name: schoolRegex },
          { description: schoolRegex }
        ]
      });
    }

    if (search) {
      const searchRegex = makeFlexibleRegex(search);
      conditions.push({
        $or: [
          { name: searchRegex },
          { category: searchRegex },
          { brand: searchRegex },
          { description: searchRegex }
        ]
      });
    }

    if ((minPrice !== undefined && !Number.isNaN(minPrice)) || (maxPrice !== undefined && !Number.isNaN(maxPrice))) {
      const priceFilter: any = {};
      if (minPrice !== undefined && !Number.isNaN(minPrice)) priceFilter.$gte = minPrice;
      if (maxPrice !== undefined && !Number.isNaN(maxPrice)) priceFilter.$lte = maxPrice;
      conditions.push({ priceNum: priceFilter });
    }

    const filter = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const sort: Record<string, 1 | -1> = { id: 1 };
    if (sortBy === 'price-asc') sort.priceNum = 1;
    else if (sortBy === 'price-desc') sort.priceNum = -1;
    else if (sortBy === 'rating') sort.rating = -1;

    const total = await ProductModel.countDocuments(filter);
    const products = await ProductModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const pages = Math.max(1, Math.ceil(total / limit));
    return res.json({
      products,
      pagination: { page, limit, total, pages },
    });
  } catch (err) {
    console.error(err);
    return res.status(503).json({ error: 'Service de données temporairement indisponible.' });
  }
});


// Get product by ID (public)
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const identifier = String(req.params.id);
    const numericId = Number(identifier);
    const query: any = { $or: [] };

    if (!Number.isNaN(numericId)) {
      query.$or.push({ id: numericId });
      query.$or.push({ id: identifier });
    }

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query.$or.push({ _id: identifier });
    }

    if (query.$or.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await ProductModel.findOne(query.$or.length === 1 ? query.$or[0] : query).lean();
    if (!product || product.status !== 'active') return res.status(404).json({ error: 'Product not found' });
    return res.json({ product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await getCategories();
    return res.json({ categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all brands (public)
router.get('/brands', async (_req: Request, res: Response) => {
  try {
    const brands = await BrandModel.find({}).sort({ name: 1 }).lean();
    return res.json({ brands });
  } catch (err) {
    console.error('Error fetching public brands:', err);
    return res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Validate coupon (public)
router.post('/coupons/validate', [
  body('code').trim().isLength({ min: 1 }).withMessage('Code promo requis'),
  body('cartTotal').isFloat({ min: 0 }).withMessage('Montant du panier invalide'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { code, cartTotal } = req.body;
    const result = await validateCoupon(code, Number(cartTotal));
    if (!result.valid) {
      return res.status(400).json({ valid: false, error: result.error });
    }
    return res.json({
      valid: true,
      discountAmount: result.discountAmount,
      coupon: {
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// GET all dynamic page settings/blocks
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await PageSettingsModel.find().lean();
    const settingsMap = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.content;
      return acc;
    }, {});
    return res.json({ settings: settingsMap });
  } catch (err) {
    console.error('Error fetching layout settings:', err);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET specific setting block by key
router.get('/settings/:key', async (req: Request, res: Response) => {
  try {
    const setting = await PageSettingsModel.findOne({ key: req.params.key }).lean();
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    return res.json({ key: setting.key, content: setting.content });
  } catch (err) {
    console.error(`Error fetching setting ${req.params.key}:`, err);
    return res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// PUT /api/settings/:key (Admin only)
router.put('/settings/:key', authenticateAdmin, async (req: Request, res: Response) => {
  const { key } = req.params;
  const content = req.body;
  try {
    const updated = await PageSettingsModel.findOneAndUpdate({ key }, { content }, { new: true, upsert: true });
    return res.json(updated);
  } catch (err) {
    console.error(`Error saving setting ${key}:`, err);
    return res.status(500).json({ error: 'Failed to save setting' });
  }
});

// DELETE /api/settings/:key (Admin only)
router.delete('/settings/:key', authenticateAdmin, async (req: Request, res: Response) => {
  const { key } = req.params;
  try {
    const result = await PageSettingsModel.deleteOne({ key });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Setting not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(`Error deleting setting ${key}:`, err);
    return res.status(500).json({ error: 'Failed to delete setting' });
  }
});

// Create Order (Public Checkout)
// The backend is the single source of truth for prices.
// The client sends item identifiers + quantities (+ selectedOptions) only.
router.post('/orders', [
  body('customerName').trim().isLength({ min: 2 }).withMessage('Le nom du client est requis (min 2 caractères)'),
  body('items').isArray({ min: 1 }).withMessage('Au moins un article est requis'),
  body('items.*.productId').notEmpty().withMessage('ID produit requis'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantité invalide'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    customerGovernorate,
    items,
    paymentMethod,
    deliveryNotes,
    couponCode
  } = req.body;

  let orderUserId = 'guest';
  let token = (req as any).cookies?.jwt;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (token) {
    const { verifyAccessToken } = await import('../middleware/jwtTokens.ts');
    const decoded = verifyAccessToken(token);
    if (decoded && decoded.userId) {
      orderUserId = decoded.userId;
    }
  }

  const successfullyReserved: any[] = [];

  try {
    // 1. Atomically reserve stock for each item
    for (const item of items) {
      const pid = item.productId;
      const qty = Number(item.quantity);
      if (!qty || qty <= 0 || Number.isNaN(qty)) {
        throw new Error('Quantité de produit invalide.');
      }

      const query = buildProductLookupQuery(pid);
      // Attempt atomic decrement if stock is sufficient
      const product = await ProductModel.findOneAndUpdate(
        { ...query, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );

      if (!product) {
        // Find the product without stock limit to give a helpful error
        const existingProduct = await ProductModel.findOne(query).lean();
        if (!existingProduct) {
          const notFoundErr = new Error(`Le produit avec l'identifiant "${pid}" est introuvable.`);
          (notFoundErr as any).status = 404;
          throw notFoundErr;
        } else {
          throw new Error(`stock insuffisant pour le produit "${existingProduct.name}". Stock disponible: ${existingProduct.stock}`);
        }
      }

      // Compute unit price server-side
      const unitPrice = (product as any).promoPrice || product.priceNum || parseFloat(String(product.price).replace(/[^\d.]/g, '')) || 0;
      
      successfullyReserved.push({
        productId: product._id,
        name: product.name,
        quantity: qty,
        unitPrice,
        image: product.img || product.images?.[0] || '',
        selectedOptions: item.selectedOptions || {},
      });
    }

    // 2. Format snapshots & compute totals
    const resolvedItems = successfullyReserved.map((r) => ({
      productId: r.productId,
      name: r.name,
      price: r.unitPrice, 
      unitPrice: r.unitPrice,
      quantity: r.quantity,
      subtotal: r.unitPrice * r.quantity,
      img: r.image, 
      image: r.image,
      selectedOptions: r.selectedOptions,
    }));

    const productSubtotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);
    const productIds = successfullyReserved.map((r) => r.productId);

    // Free shipping threshold: 0 DT if subtotal >= 200 DT, else 7 DT
    const shippingFee = productSubtotal >= 200 ? 0 : 7;
    let discountAmount = 0;

    if (couponCode) {
      const { validateCoupon } = await import('../repositories/couponRepository.ts');
      const couponResult = await validateCoupon(couponCode, productSubtotal);
      if (!couponResult.valid) {
        throw new Error(couponResult.error || "Code promo invalide.");
      }
      discountAmount = couponResult.discountAmount;

      // Update coupon usage count
      const { CouponModel } = await import('../models/index.ts');
      await CouponModel.updateOne(
        { code: couponCode.toUpperCase() },
        { $inc: { usageCount: 1 } }
      ).exec();
    }

    const grandTotal = Math.max(0, productSubtotal + shippingFee - discountAmount);

    // 3. Create the order document
    const newOrder = new OrderModel({
      userId: orderUserId,
      customerName,
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || '',
      customerGovernorate: customerGovernorate || '',
      productIds,
      items: resolvedItems,
      total: grandTotal,
      shippingFee,
      couponCode: couponCode ? couponCode.toUpperCase() : '',
      discountAmount,
      date: new Date(),
      status: 'pending',
      stockReserved: true, // mark stock as successfully reserved
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      deliveryNotes: deliveryNotes || '',
      shippingAddress: {
        address: customerAddress || '',
        city: '',
        governororate: customerGovernorate || '',
        postalCode: '',
      },
    });

    const saved = await newOrder.save();
    return res.status(201).json({
      orderId: saved._id.toString(),
      total: grandTotal,
      shippingFee,
      couponCode: saved.couponCode,
      discountAmount,
      items: resolvedItems.map((i) => ({
        productId: i.productId.toString(),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    });
  } catch (err: any) {
    // 4. Compensation: Rollback stock reservation on failure
    for (const reserved of successfullyReserved) {
      try {
        await ProductModel.findOneAndUpdate(
          { _id: reserved.productId },
          { $inc: { stock: reserved.quantity } }
        ).exec();
      } catch (rollbackErr) {
        console.error(`[Rollback] Failed to restore stock for product ${reserved.productId}:`, rollbackErr);
      }
    }

    console.error('[Order] Error creating order:', err);
    return res.status((err as any).status || 400).json({ error: err.message || 'Échec de la création de la commande.' });
  }
});

// Get User Orders (Protected against IDOR)
router.get('/orders/user/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (requester.role !== 'admin' && requester.userId !== req.params.userId) {
      return res.status(403).json({ error: "Accès refusé. Vous ne pouvez consulter que vos propres commandes." });
    }
    const orders = await OrderModel.find({ userId: req.params.userId }).sort({ date: -1 }).lean();
    return res.json({ orders });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Cancel Order (Protected - Customers can only cancel their own pending orders)
router.put('/orders/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester || !requester.userId) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    const orderId = req.params.id;
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    // Security check: Only the order owner or an admin can cancel
    if (requester.role !== 'admin' && order.userId !== requester.userId) {
      return res.status(403).json({ error: "Accès refusé. Vous ne pouvez annuler que vos propres commandes." });
    }

    // Business check: Only pending orders can be cancelled by the user (admins can cancel anything)
    if (requester.role !== 'admin' && order.status !== 'pending') {
      return res.status(400).json({ error: "Cette commande ne peut plus être annulée car elle est déjà en cours de traitement." });
    }

    order.status = 'cancelled';
    await order.save();

    // Release reserved stock back to the products
    if (order.stockReserved && order.items && order.items.length > 0) {
      for (const item of order.items) {
        try {
          await ProductModel.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: item.quantity } }
          ).exec();
        } catch (stockErr) {
          console.error(`[Cancel Order] Failed to release stock for product ${item.productId}:`, stockErr);
        }
      }
      order.stockReserved = false;
      await order.save();
    }

    return res.json({ success: true, message: 'La commande a été annulée avec succès.', order });
  } catch (err) {
    console.error('Order cancellation error:', err);
    return res.status(500).json({ error: "Échec de l'annulation de la commande." });
  }
});

export default router;
