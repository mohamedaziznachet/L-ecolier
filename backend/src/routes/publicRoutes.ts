import express from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { ProductModel, OrderModel, PageSettingsModel, BrandModel, ReviewModel } from '../models/index.ts';
import { getCategories, buildProductLookupQuery, seedInitialProductsIfEmpty } from '../repositories/productRepository.ts';
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

const CATEGORY_SUBCATEGORIES_MAP: Record<string, string[]> = {
  "Fournitures Scolaires": [
    "Crayon Noir", "Crayon de Couleur", "Stylo à Bille", "Feutre & Marqueur",
    "Gomme", "Taille-Crayon", "Mines", "Ciseaux", "Colle & Adhésif",
    "Correcteur", "Instruments de Traçage", "Agrafage", "Bureautique", "Calculatrices", "Tableaux & Ardoises", "Compas"
  ],
  "Fournitures scolaire": [
    "Crayon Noir", "Crayon de Couleur", "Stylo à Bille", "Feutre & Marqueur",
    "Gomme", "Taille-Crayon", "Mines", "Ciseaux", "Colle & Adhésif",
    "Correcteur", "Instruments de Traçage", "Agrafage", "Bureautique", "Calculatrices", "Tableaux & Ardoises", "Compas"
  ],
  "Bomi": [
    "Cartable Lux", "Cartable Eco Lux", "Cartable super lux", "Cartable high lux",
    "Trousse", "Lunch box", "paniers", "Chariots"
  ],
  "Sac A Dos": [
    "Sac A Dos Informatique", "Take And Go", "Trousse", "Sacs à dos", "Sac à dos", "Cartable"
  ],
  "Sacs à dos": [
    "Sac A Dos Informatique", "Take And Go", "Trousse", "Sac A Dos", "Sac à dos", "Cartable"
  ],
  "Bagagerie": [
    "Valise WAMA", "Valise", "Bagages", "Sac de voyage"
  ],
  "Parascolaires": [
    "Dictionnaires", "Atlas & Cartes", "Livres Éducatifs", "Cahiers d'Exercices", "Parascolaire"
  ],
  "Parascolaire": [
    "Dictionnaires", "Atlas & Cartes", "Livres Éducatifs", "Cahiers d'Exercices", "Parascolaires"
  ],
  "Gourde & Thermos": [
    "TupperWare", "Rotpunkt", "Uzspace", "Gourdes", "Thermos", "Gourde", "Boîte repas", "Lunch box"
  ],
  "Gourdes & Boîtes repas": [
    "TupperWare", "Rotpunkt", "Uzspace", "Gourdes", "Thermos", "Lunch box", "Gourde", "Boîte repas"
  ],
  "Cahiers & Papeterie": [
    "Cahiers", "Brochures & Blocs", "Carnets & Agendas", "Ramettes", "Papeterie", "Cahier"
  ],
  "Papeterie": [
    "Cahiers", "Brochures & Blocs", "Carnets & Agendas", "Ramettes", "Cahiers & Papeterie", "Cahier"
  ],
  "Rangement & Classement": [
    "Classeurs", "Chemises", "Porte-Documents", "Boîtes d'archives", "Pochettes"
  ],
  "Matériel Artistique & Dessin": [
    "Peinture & Gouache", "Crayons de Dessin", "Pinceaux & Palettes", "Papier Dessin", "Matériel Artistique", "Dessin"
  ],
  "Matériel Artistique": [
    "Peinture & Gouache", "Crayons de Dessin", "Pinceaux & Palettes", "Papier Dessin", "Matériel Artistique & Dessin", "Dessin"
  ],
  "Jeux Et Cadeaux": [
    "Jeux Éducatifs", "Jouets", "Cadeaux Scolaires", "Jeux et Cadeaux", "Jeux et Jouets", "Jeux"
  ],
  "Jeux et Jouets": [
    "Jeux Éducatifs", "Jouets", "Cadeaux Scolaires", "Jeux Et Cadeaux", "Jeux et Cadeaux", "Jeux"
  ],
};

// Get filtered products (public storefront)
router.get('/products', async (req: Request, res: Response) => {
  try {
    const totalDocs = await ProductModel.countDocuments();
    if (totalDocs === 0) {
      await seedInitialProductsIfEmpty();
    }
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20);
    const search = String(req.query.search ?? '').trim();
    const category = String(req.query.category ?? '').trim();
    const subcategory = String(req.query.subcategory ?? '').trim();
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
      const catOrConditions: any[] = [];
      const catRegex = makeFlexibleRegex(category);
      catOrConditions.push(
        { category: catRegex },
        { subcategory: catRegex },
        { brand: catRegex },
        { name: catRegex },
        { description: catRegex }
      );

      // Add all subcategories mapped to this parent category
      const mappedSubs = CATEGORY_SUBCATEGORIES_MAP[category] || [];
      for (const sub of mappedSubs) {
        const subRegex = makeFlexibleRegex(sub);
        catOrConditions.push(
          { category: subRegex },
          { subcategory: subRegex }
        );
      }

      // Also handle multi-part (e.g. "Cahiers & Papeterie")
      if (category.includes('&')) {
        const parts = category.split('&').map(p => p.trim()).filter(Boolean);
        for (const part of parts) {
          const partRegex = makeFlexibleRegex(part);
          catOrConditions.push(
            { category: partRegex },
            { subcategory: partRegex }
          );
        }
      }

      conditions.push({ $or: catOrConditions });
    }

    if (subcategory) {
      const subRegex = makeFlexibleRegex(subcategory);
      conditions.push({
        $or: [
          { subcategory: subRegex },
          { category: subRegex },
          { name: subRegex },
          { description: subRegex }
        ]
      });
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

    const baseConditions = [...conditions];
    const baseFilter = baseConditions.length === 1 ? baseConditions[0] : { $and: baseConditions };

    const highestPricedDoc = await ProductModel.findOne(baseFilter)
      .sort({ priceNum: -1 })
      .select('priceNum')
      .lean();
    const maxCategoryPrice = highestPricedDoc && typeof highestPricedDoc.priceNum === 'number' && highestPricedDoc.priceNum > 0
      ? Math.ceil(highestPricedDoc.priceNum)
      : 1000;

    if ((minPrice !== undefined && !Number.isNaN(minPrice)) || (maxPrice !== undefined && !Number.isNaN(maxPrice))) {
      const priceFilter: any = {};
      if (minPrice !== undefined && !Number.isNaN(minPrice)) priceFilter.$gte = minPrice;
      if (maxPrice !== undefined && !Number.isNaN(maxPrice)) priceFilter.$lte = maxPrice;
      conditions.push({ priceNum: priceFilter });
    }

    const filter = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const sort: Record<string, 1 | -1> = {};
    if (sortBy === 'price-asc') sort.priceNum = 1;
    else if (sortBy === 'price-desc') sort.priceNum = -1;
    else if (sortBy === 'rating') sort.rating = -1;
    else if (sortBy === 'newest') sort._id = -1;
    else sort.name = 1;

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
      maxCategoryPrice,
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
      query.$or.push({ barcode: numericId });
    }
    query.$or.push({ barcode: identifier });

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query.$or.push({ _id: identifier });
    }

    if (query.$or.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await ProductModel.findOne(query.$or.length === 1 ? query.$or[0] : query).lean();
    if (!product || (product.status && product.status === 'inactive')) return res.status(404).json({ error: 'Product not found' });
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
    const { code, cartTotal, items } = req.body;
    const result = await validateCoupon(code, Number(cartTotal), Array.isArray(items) ? items : []);
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
        applicableCategories: result.applicableCategories,
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
    const updated = await PageSettingsModel.findOneAndUpdate(
      { key },
      { key, content },
      { returnDocument: 'after', new: true, upsert: true }
    );
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
        { returnDocument: 'after' }
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

    // Free shipping threshold: 0 DT if subtotal >= 200 DT, else 8 DT
    const shippingFee = productSubtotal >= 200 ? 0 : 8;
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

/* ------------------------------------------------------------------ */
/*   Customer Reviews (Avis Clients)                                  */
/* ------------------------------------------------------------------ */

// GET /api/reviews/product/:productId - Get approved customer reviews for a product
router.get('/reviews/product/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const reviews = await ReviewModel.find({ 
      $or: [
        { productId: productId },
        { productId: String(productId) }
      ]
    }).sort({ createdAt: -1 }).lean();

    return res.json({ reviews });
  } catch (err) {
    console.error('Error fetching product reviews:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews - Submit a new customer review for a product
router.post('/reviews', [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('customerName').trim().notEmpty().withMessage('Name is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { productId, productName, customerName, rating, comment, userId } = req.body;

    const newReview = new ReviewModel({
      productId,
      productName: productName || '',
      userId: userId || 'guest',
      customerName: customerName.trim(),
      rating: Number(rating),
      comment: comment ? comment.trim() : '',
    });

    await newReview.save();

    // Recalculate average rating & review count for the product
    try {
      const allProductReviews = await ReviewModel.find({
        $or: [{ productId: productId }, { productId: String(productId) }]
      }).lean();

      if (allProductReviews.length > 0) {
        const totalRating = allProductReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
        const avgRating = Number((totalRating / allProductReviews.length).toFixed(1));

        await ProductModel.findOneAndUpdate(
          buildProductLookupQuery(productId),
          { rating: avgRating, reviews: allProductReviews.length }
        ).exec();
      }
    } catch (updateErr) {
      console.error('Error updating product rating/reviews summary:', updateErr);
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Votre avis a été publié avec succès ! Merci pour votre retour.',
      review: newReview 
    });
  } catch (err) {
    console.error('Error submitting customer review:', err);
    return res.status(500).json({ error: 'Échec de l\'envoi de votre avis.' });
  }
});

export default router;

