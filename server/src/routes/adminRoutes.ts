// server/src/routes/adminRoutes.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticateAdmin } from '../middleware/auth.ts';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { UserModel, OrderModel, ProductModel, BrandModel, CouponModel, ReviewModel } from '../models/index.ts';
import { getAllProducts, insertProduct, updateProduct, deleteProduct, buildProductLookupQuery } from '../repositories/productRepository.ts';
import { getSavedCategories, addCategory, deleteCategory, resetCategories } from '../repositories/categoryRepository.ts';
import { appendAuditEntry } from '../repositories/auditRepository.ts';
import { getAllCoupons, getCouponById, insertCoupon, updateCoupon, deleteCoupon } from '../repositories/couponRepository.ts';

const router = Router();

// Strict Admin Privilege Protection for all admin endpoints
router.use(authenticateAdmin);

// Extend Request type for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

import os from 'os';

// Configure upload directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads using disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const extname = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(extname) && allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

// All admin routes are protected with admin role check
router.use(authenticateAdmin);

/* ------------------------------------------------------------------ */
/*   Image Upload                                                       */
/* ------------------------------------------------------------------ */

router.post('/upload-image', upload.single('image'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    let imageUrl = `/uploads/${req.file.filename}`;

    if (process.env.CLOUDINARY_URL) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'lecolier' });
        imageUrl = result.secure_url;
        // Clean up local temp file after Cloudinary upload
        fs.promises.unlink(req.file.path).catch(err => console.error('Failed to unlink temp upload file:', err));
      } catch (cloudErr) {
        console.error('Cloudinary upload failed, falling back to local file:', cloudErr);
      }
    }

    await appendAuditEntry({
      action: 'upload-image',
      entity: 'image',
      success: true,
      details: imageUrl,
      user: req.user?.email || 'unknown',
      role: 'admin',
    });

    res.json({ imageUrl });
  } catch (err: any) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/* ------------------------------------------------------------------ */
/*   Dashboard Stats                                                    */
/* ------------------------------------------------------------------ */

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      totalProducts,
      totalUsers,
      totalOrders,
      totalCategories,
      totalBrands,
      revenueAgg,
      lowStockProducts,
      recentOrders,
      ordersByStatus,
      recentSales,
    ] = await Promise.all([
      ProductModel.countDocuments({}),
      UserModel.countDocuments({}),
      OrderModel.countDocuments({}),
      getSavedCategories().then(c => c.length),
      BrandModel.countDocuments({}),
      OrderModel.aggregate([
        { $match: { status: { $in: ['delivered', 'shipped', 'confirmed', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      ProductModel.find({ stock: { $gt: 0, $lte: 5 } }).select('name stock img category').lean().limit(10),
      OrderModel.find({}).sort({ date: -1 }).limit(5).lean(),
      OrderModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$total' }
          }
        }
      ]),
      // Last 7 days sales by date (only validated/confirmed/delivered orders)
      OrderModel.aggregate([
        {
          $match: {
            status: { $in: ['delivered', 'shipped', 'confirmed', 'processing'] },
            date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
    ]);

    const confirmedRevenue = revenueAgg[0]?.total || 0;

    // Calculate revenue breakdown by status category
    let deliveredRevenue = 0;
    let pendingRevenue = 0;
    let cancelledRevenue = 0;

    for (const item of ordersByStatus) {
      if (item._id === 'delivered') {
        deliveredRevenue += item.totalRevenue || 0;
      } else if (item._id === 'pending') {
        pendingRevenue += item.totalRevenue || 0;
      } else if (item._id === 'cancelled' || item._id === 'expired') {
        cancelledRevenue += item.totalRevenue || 0;
      }
    }

    return res.json({
      totalProducts,
      totalUsers,
      totalOrders,
      totalCategories,
      totalBrands,
      totalRevenue: confirmedRevenue,
      confirmedRevenue,
      deliveredRevenue,
      pendingRevenue,
      cancelledRevenue,
      lowStockProducts,
      recentOrders,
      ordersByStatus,
      recentSales,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/* ------------------------------------------------------------------ */
/*   Products CRUD                                                     */
/* ------------------------------------------------------------------ */

// GET /admin/products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const brand = (req.query.brand as string) || '';
    const sortField = (req.query.sortField as string) || 'name';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? -1 : 1;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: '^' + search, $options: 'i' } },
        { category: { $regex: '^' + search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    const validSortFields = ['name', 'priceNum', 'stock', 'category', 'brand'];
    const safeSortField = validSortFields.includes(sortField) ? sortField : 'name';

    const total = await ProductModel.countDocuments(filter);
    const products = await ProductModel.find(filter)
      .sort({ [safeSortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /admin/products/:id
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findOne({
      $or: [
        { _id: (req.params.id as string) },
        { id: parseInt((req.params.id as string)) }
      ]
    }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /admin/products
router.post('/products', async (req: Request, res: Response) => {
  try {
    const product = req.body;
    const insertedId = await insertProduct(product);
    await appendAuditEntry({
      action: 'create-product',
      entity: 'product',
      entityId: insertedId,
      success: true,
      details: JSON.stringify({ name: product.name, category: product.category }),
      user: req.user?.email || 'unknown',
      role: 'admin',
    });
    return res.status(201).json({ insertedId });
  } catch (err: any) {
    console.error(err);
    await appendAuditEntry({
      action: 'create-product',
      entity: 'product',
      success: false,
      details: err.message,
      user: req.user?.email || 'unknown',
      role: 'admin',
    });
    return res.status(500).json({ error: 'Failed to insert product' });
  }
});

// PUT /admin/products/:id
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updates = req.body;
    const product = await updateProduct(id, updates);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await appendAuditEntry({
      action: 'update-product',
      entity: 'product',
      entityId: String(id),
      success: true,
      details: JSON.stringify(updates),
      user: req.user?.email || 'unknown',
      role: 'admin',
    });
    return res.json({ updated: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /admin/products/:id
router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteProduct(id as string);
    if (!success) return res.status(404).json({ error: 'Product not found' });
    await appendAuditEntry({
      action: 'delete-product',
      entity: 'product',
      entityId: String(id),
      success: true,
      details: JSON.stringify({ deletedProduct: success }),
      user: req.user?.email || 'unknown',
      role: 'admin',
    });
    return res.json({ deleted: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

/* ------------------------------------------------------------------ */
/*   Categories CRUD                                                   */
/* ------------------------------------------------------------------ */

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await getSavedCategories();
    return res.json({ categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { category } = req.body;
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    const categories = await addCategory(category);
    return res.status(201).json({ categories });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to add category' });
  }
});

router.delete('/categories/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category as string;
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const categories = await deleteCategory(category);
    return res.json({ categories });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
});

router.post('/categories/reset', async (_req: Request, res: Response) => {
  try {
    const categories = await resetCategories();
    return res.json({ categories });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to reset categories' });
  }
});

/* ------------------------------------------------------------------ */
/*   Brands CRUD                                                       */
/* ------------------------------------------------------------------ */

// GET /admin/brands
router.get('/brands', async (_req: Request, res: Response) => {
  try {
    const brands = await BrandModel.find({}).sort({ name: 1 }).lean();
    return res.json({ brands });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// POST /admin/brands
router.post('/brands', async (req: Request, res: Response) => {
  try {
    const { name, logo, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Brand name is required' });
    const brandObj = new BrandModel({ name, logo, description });
    await brandObj.save();
    const insertedId = brandObj._id.toString();
    return res.status(201).json({ insertedId });
  } catch (err: any) {
    console.error(err);
    if (err.code === 11000) return res.status(400).json({ error: 'Brand name already exists' });
    return res.status(500).json({ error: 'Failed to create brand' });
  }
});

// PUT /admin/brands/:id
router.put('/brands/:id', async (req: Request, res: Response) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;
    const brand = await BrandModel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    return res.json({ updated: true, brand });
  } catch (err: any) {
    console.error(err);
    if (err.code === 11000) return res.status(400).json({ error: 'Brand name already exists' });
    return res.status(500).json({ error: 'Failed to update brand' });
  }
});

// DELETE /admin/brands/:id
router.delete('/brands/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await BrandModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Brand not found' });
    return res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete brand' });
  }
});

/* ------------------------------------------------------------------ */
/*   Codes Promo (Coupons) CRUD                                        */
/* ------------------------------------------------------------------ */

// GET /admin/coupons
router.get('/coupons', async (_req: Request, res: Response) => {
  try {
    const coupons = await getAllCoupons();
    return res.json({ coupons });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /admin/coupons
router.post('/coupons', async (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, expiresAt, isActive } = req.body;
    if (!code || !discountType || discountValue === undefined || !expiresAt) {
      return res.status(400).json({ error: 'code, discountType, discountValue, and expiresAt are required' });
    }
    const insertedId = await insertCoupon({
      code,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      expiresAt: new Date(expiresAt),
      isActive: isActive !== false,
    });
    const coupon = await getCouponById(insertedId);
    return res.status(201).json({ insertedId, coupon });
  } catch (err: any) {
    console.error(err);
    if (err.code === 11000) return res.status(400).json({ error: 'Coupon code already exists' });
    return res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// PUT /admin/coupons/:id
router.put('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    if (updates.expiresAt) updates.expiresAt = new Date(updates.expiresAt);
    if (updates.discountValue !== undefined) updates.discountValue = Number(updates.discountValue);
    if (updates.minOrderAmount !== undefined) updates.minOrderAmount = Number(updates.minOrderAmount);
    const coupon = await updateCoupon((req.params.id as string), updates);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    return res.json({ updated: true, coupon });
  } catch (err: any) {
    console.error(err);
    if (err.code === 11000) return res.status(400).json({ error: 'Coupon code already exists' });
    return res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// DELETE /admin/coupons/:id
router.delete('/coupons/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteCoupon((req.params.id as string));
    if (!deleted) return res.status(404).json({ error: 'Coupon not found' });
    return res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

/* ------------------------------------------------------------------ */
/*   Reviews                                                           */
/* ------------------------------------------------------------------ */

// GET /admin/reviews
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    
    const filter: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ productName: regex }, { customerName: regex }, { comment: regex }];
    }
    const total = await ReviewModel.countDocuments(filter);
    const reviews = await ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const pages = Math.ceil(total / limit);

    return res.json({ reviews, pagination: { page, limit, total, pages } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// DELETE /admin/reviews/:id
router.delete('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await ReviewModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Review not found' });
    return res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
});

/* ------------------------------------------------------------------ */
/*   Users (CRUD + Block/Unblock)                                      */
/* ------------------------------------------------------------------ */

// GET /admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';

    const filter: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter, '-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Efficient single-query aggregation to get order counts per user (fixes N+1 problem)
    const userIds = users.map((u: any) => u._id.toString());
    const orderCounts = await OrderModel.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    const orderCountMap = new Map(orderCounts.map((o: any) => [o._id, o.count]));

    const usersWithOrders = users.map((u: any) => {
      const uid = u._id.toString();
      return { ...u, id: uid, ordersCount: orderCountMap.get(uid) || 0 };
    });

    return res.json({ users: usersWithOrders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /admin/users/:id
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id as string).select('-password').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const orders = await OrderModel.find({ userId: (id as string) }).sort({ date: -1 }).lean();
    return res.json({ user: { ...(user as any), id: (user as any)._id.toString() }, orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /admin/users/:id (block/unblock or general update)
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { isBlocked, ...otherUpdates } = req.body;
    const updates: any = { ...otherUpdates };
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;

    const user = await UserModel.findByIdAndUpdate((req.params.id as string), updates, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ updated: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /admin/users/:id
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deletedUser = await UserModel.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    return res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

/* ------------------------------------------------------------------ */
/*   Orders                                                            */
/* ------------------------------------------------------------------ */

// GET /admin/orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    const filter: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ customerName: regex }, { customerPhone: regex }, { customerEmail: regex }];
    }
    if (status) filter.status = status;

    const total = await OrderModel.countDocuments(filter);
    const orders = await OrderModel.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /admin/orders/:id
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await OrderModel.findById((req.params.id as string)).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({ order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Helper to validate order status transition - flexible for admins
function isValidTransition(_currentStatus: string, _newStatus: string): boolean {
  // Allow admins to switch to any status freely (e.g. un-cancelling, setting back to processing, etc.)
  return true;
}

// PUT /admin/orders/:id/status — Update order status
router.put('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId before querying to prevent CastError crashes
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Identifiant de commande invalide.' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'expired'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await OrderModel.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const currentStatus = order.status || 'pending';
    if (currentStatus === status) {
      return res.json({ updated: true, status: order.status, paymentStatus: order.paymentStatus });
    }

    if (!isValidTransition(currentStatus, status)) {
      return res.status(400).json({ error: `Transition de statut invalide de "${currentStatus}" vers "${status}".` });
    }

    let stockReserved = order.stockReserved;

    if (status === 'cancelled' || status === 'expired') {
      if (stockReserved) {
        // Restore stock
        for (const item of order.items || []) {
          const quantity = Number(item.quantity) || 1;
          const productId = item.productId;
          const productQuery = buildProductLookupQuery(productId);
          try {
            await ProductModel.findOneAndUpdate(productQuery, { $inc: { stock: quantity } }).exec();
          } catch (stockErr) {
            console.error(`[Stock] Failed to restore stock for productId=${productId}:`, stockErr);
          }
        }
        stockReserved = false;
      }
    } else if (['confirmed', 'processing', 'shipped', 'delivered'].includes(status)) {
      if (!stockReserved) {
        // Decrement stock
        for (const item of order.items || []) {
          const quantity = Number(item.quantity) || 1;
          const productId = item.productId;
          const productQuery = buildProductLookupQuery(productId);
          try {
            await ProductModel.findOneAndUpdate(productQuery, { $inc: { stock: -quantity } }).exec();
          } catch (stockErr) {
            console.error(`[Stock] Failed to decrement stock for productId=${productId}:`, stockErr);
          }
        }
        stockReserved = true;
      }
    }

    order.status = status;
    order.stockReserved = stockReserved;

    if (['pending', 'processing', 'expired', 'cancelled'].includes(status)) {
      order.paymentStatus = 'pending';
    } else if (status === 'delivered') {
      order.paymentStatus = 'paid';
    }

    const savedOrder = await order.save();
    return res.json({ updated: true, status: savedOrder.status, paymentStatus: savedOrder.paymentStatus });
  } catch (err: any) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Identifiant invalide dans la commande.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

// PUT /admin/orders/:id/payment — Toggle payment status (for COD)
router.put('/orders/:id/payment', async (req: Request, res: Response) => {
  try {
    const { paymentStatus } = req.body;
    const validStatuses = ['pending', 'paid', 'failed'];
    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ error: `Invalid paymentStatus. Must be one of: ${validStatuses.join(', ')}` });
    }
    const order = await OrderModel.findByIdAndUpdate(
      (req.params.id as string),
      { paymentStatus },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json({ updated: true, paymentStatus: order.paymentStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// PUT /admin/orders/:id — General update (backward compat)
router.put('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Identifiant de commande invalide.' });
    }

    const updates = req.body;

    const order = await OrderModel.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (updates.status && updates.status !== order.status) {
      const currentStatus = order.status || 'pending';
      const status = updates.status;
      const validStatuses = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'expired'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status: ${status}` });
      }

      if (!isValidTransition(currentStatus, status)) {
        return res.status(400).json({ error: `Transition de statut invalide de "${currentStatus}" vers "${status}".` });
      }

      let stockReserved = order.stockReserved;

      if (status === 'cancelled' || status === 'expired') {
        if (stockReserved) {
          // Restore stock
          for (const item of order.items || []) {
            const quantity = Number(item.quantity) || 1;
            const productId = item.productId;
            const productQuery = buildProductLookupQuery(productId);
            try {
              await ProductModel.findOneAndUpdate(productQuery, { $inc: { stock: quantity } }).exec();
            } catch (stockErr) {
              console.error(`[Stock] Failed to restore stock:`, stockErr);
            }
          }
          stockReserved = false;
        }
      } else if (['confirmed', 'processing', 'shipped', 'delivered'].includes(status)) {
        if (!stockReserved) {
          // Decrement stock
          for (const item of order.items || []) {
            const quantity = Number(item.quantity) || 1;
            const productId = item.productId;
            const productQuery = buildProductLookupQuery(productId);
            try {
              await ProductModel.findOneAndUpdate(productQuery, { $inc: { stock: -quantity } }).exec();
            } catch (stockErr) {
              console.error(`[Stock] Failed to decrement stock:`, stockErr);
            }
          }
          stockReserved = true;
        }
      }

      order.status = status;
      order.stockReserved = stockReserved;

      if (['pending', 'processing', 'expired', 'cancelled'].includes(status)) {
        order.paymentStatus = 'pending';
      } else if (status === 'delivered') {
        order.paymentStatus = 'paid';
      }
    }

    // Apply other updates
    if (updates.customerName !== undefined) order.customerName = updates.customerName;
    if (updates.customerEmail !== undefined) order.customerEmail = updates.customerEmail;
    if (updates.customerPhone !== undefined) order.customerPhone = updates.customerPhone;
    if (updates.customerAddress !== undefined) order.customerAddress = updates.customerAddress;
    if (updates.customerGovernorate !== undefined) order.customerGovernorate = updates.customerGovernorate;
    if (updates.paymentMethod !== undefined) order.paymentMethod = updates.paymentMethod;
    if (updates.paymentStatus !== undefined) order.paymentStatus = updates.paymentStatus;
    if (updates.deliveryNotes !== undefined) order.deliveryNotes = updates.deliveryNotes;

    const savedOrder = await order.save();
    return res.json({ updated: true, status: savedOrder.status, paymentStatus: savedOrder.paymentStatus });
  } catch (err: any) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /admin/orders/:id
router.delete('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Identifiant de commande invalide.' });
    }

    const order = await OrderModel.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Restore stock if reserved before deletion
    if (order.stockReserved) {
      for (const item of order.items || []) {
        const quantity = Number(item.quantity) || 1;
        const productId = item.productId;
        const productQuery = buildProductLookupQuery(productId);
        try {
          await ProductModel.findOneAndUpdate(productQuery, { $inc: { stock: quantity } }).exec();
        } catch (stockErr) {
          console.error(`[Stock] Failed to restore stock on deletion:`, stockErr);
        }
      }
    }

    await OrderModel.deleteOne({ _id: order._id });
    return res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete order' });
  }
});

/* ------------------------------------------------------------------ */
/*   Audit Log                                                         */
/* ------------------------------------------------------------------ */

router.get('/audit', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(500, parseInt((req.query.limit as string) || '50'));
    const { getAuditEntries } = await import('../repositories/auditRepository.ts');
    const entries = await getAuditEntries(limit);
    return res.json({ entries });
  } catch (err) {
    console.error('Failed to fetch audit entries', err);
    return res.status(500).json({ error: 'Failed to fetch audit entries' });
  }
});

export default router;
