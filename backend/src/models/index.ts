// src/server/models.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// Product Schema
const productSchema = new Schema({
  id: { type: Schema.Types.Mixed }, // numeric or string ID for legacy compatibility
  name: { type: String, required: true, trim: true },
  price: { type: String, required: true },
  priceNum: { type: Number, required: true, min: 0 },
  priceBeforeDiscount: { type: Number, default: null },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  oldPrice: { type: String, default: null },
  schoolLevel: { type: String, default: null },
  badge: { type: String, default: null },
  badgeColor: { type: String, default: null },
  rating: { type: Number, default: 5, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  img: { type: String, default: '' },
  images: [String],
  category: { type: String, default: 'Autre', trim: true },
  brand: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  stock: { type: Number, default: 0, min: 0 },
  availability: { type: String, enum: ['En stock', 'En arrivage', 'Sur commande', 'Epuisé'], default: 'En stock', trim: true },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  specifications: [{ key: String, value: String }]
});

// Pre-save hook to synchronize img and images fields
productSchema.pre('save', function() {
  const doc = this as any;
  if (doc.img && (!doc.images || doc.images.length === 0)) {
    doc.images = [doc.img];
  } else if (doc.images && doc.images.length > 0 && !doc.img) {
    doc.img = doc.images[0];
  }
});

// Add indexes for Product
productSchema.index({ status: 1, category: 1, priceNum: 1 });
productSchema.index({ status: 1, priceNum: 1 });
productSchema.index({ status: 1, name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ category: 1, priceNum: 1 });
productSchema.index({ category: 1, name: 1 });
productSchema.index({ brand: 1, priceNum: 1 });
productSchema.index({ name: 'text', description: 'text' });

// User Schema
interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  postalCode: string;
  statut: string;
  isBlocked: boolean;
  isVerified: boolean;
  createdAt: Date;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  verificationToken: string;
  verificationTokenExpires: Date | null;
  resetPasswordToken: string;
  resetPasswordExpires: Date | null;
  wishlist: Array<string | number>;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  isLocked: () => boolean;
  incrementLoginAttempts: () => Promise<void>;
  resetFailedLoginAttempts: () => Promise<void>;
}

const userSchema = new Schema<IUserDocument>({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, default: '', trim: true },
  address: { type: String, default: '', trim: true },
  city: { type: String, default: '', trim: true },
  governorate: { type: String, default: '', trim: true },
  postalCode: { type: String, default: '', trim: true },
  statut: { type: String, default: 'client', enum: ['client', 'parent', 'student', 'teacher', 'other', 'admin'] },
  isBlocked: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  verificationToken: { type: String, default: '' },
  verificationTokenExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordExpires: { type: Date, default: null },
  wishlist: [{ type: Schema.Types.Mixed }]
});

// Hash password before saving
userSchema.pre('save', async function() {
  const doc = this as unknown as IUserDocument;
  if (!doc.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  doc.password = await bcrypt.hash(doc.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const doc = this as unknown as IUserDocument;
  return bcrypt.compare(candidatePassword, doc.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Method to increment failed login attempts
userSchema.methods.incFailedLoginAttempts = async function(): Promise<void> {
  // If already locked and lock has expired, reset
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({ $unset: { lockUntil: 1, failedLoginAttempts: 1 } }).exec();
  }
  // If already locked, don't increment
  if (this.lockUntil && this.lockUntil > new Date()) {
    return;
  }
  // Increment attempts
  const updates: any = { $inc: { failedLoginAttempts: 1 } };
  // Lock after 5 failed attempts
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: new Date(Date.now() + 30 * 60 * 1000) }; // 30 minutes
  }
  await this.updateOne(updates).exec();
};

// Method to reset failed login attempts
userSchema.methods.resetFailedLoginAttempts = async function(): Promise<void> {
  await this.updateOne({ $unset: { failedLoginAttempts: 1, lockUntil: 1 } }).exec();
};

// Add indexes for User (email already has unique: true in schema)
userSchema.index({ createdAt: -1 });

// Category Schema
const categorySchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true }
}, { timestamps: true });

// Order Schema
const orderSchema = new Schema({
  userId: { type: String, required: true },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, trim: true },
  customerPhone: { type: String, trim: true },
  customerAddress: { type: String, trim: true },
  customerGovernorate: { type: String, trim: true },
  productIds: [{ type: Schema.Types.Mixed }], // can contain string or number product IDs
  total: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  items: [{
    productId: { type: Schema.Types.Mixed },
    name: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1 },
    price: { type: Number, default: 0 }, // backward compatibility
    unitPrice: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 }, // price * quantity at purchase time
    img: { type: String, default: '' }, // backward compatibility
    image: { type: String, default: '' },
    selectedOptions: { type: Schema.Types.Mixed, default: {} }
  }],
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'expired']
  },
  stockReserved: { type: Boolean, default: false },
  paymentMethod: {
    type: String,
    default: 'cod',
    enum: ['cod', 'card', 'bank_transfer']
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'failed']
  },
  deliveryNotes: { type: String, default: '', trim: true },
  shippingAddress: {
    address: String,
    city: String,
    governororate: String,
    postalCode: String
  },
  shippingFee: { type: Number, default: 7 },
  couponCode: { type: String, default: '' },
  discountAmount: { type: Number, default: 0 }
});

// Add indexes for Order
orderSchema.index({ userId: 1 });
orderSchema.index({ date: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ userId: 1, status: 1 }); // Compound index for user orders by status
orderSchema.index({ userId: 1, date: -1 });
orderSchema.index({ status: 1, date: -1 });

// Page Settings Schema for Dynamic Everything
const pageSettingsSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  content: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

// Brand Schema
const brandSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  logo: { type: String, default: '' },
  description: { type: String, default: '', trim: true },
}, { timestamps: true });

// Coupon Schema ("Code Promo")
const couponSchema = new Schema({
  code: { type: String, required: true, trim: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  maxUses: { type: Number, default: 0 }, // 0 = unlimited
  usageCount: { type: Number, default: 0 },
}, { timestamps: true });

// Coupon pre-find middleware is handled by the repository methods to avoid filtering admin views
// couponSchema.pre(/^find/, function(this: any) {
//   this.where({ $or: [
//     { expiresAt: { $gt: new Date() } },
//     { isActive: false }
//   ]});
// });

// Review Schema
const reviewSchema = new Schema({
  productId: { type: Schema.Types.Mixed, required: true },
  productName: { type: String, default: '' },
  userId: { type: String, required: true },
  customerName: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', trim: true },
}, { timestamps: true });

reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ createdAt: -1 });

export const ProductModel = mongoose.model('Product', productSchema);
export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
export const OrderModel = mongoose.model('Order', orderSchema);
export const PageSettingsModel = mongoose.model('PageSettings', pageSettingsSchema);
export const BrandModel = mongoose.model('Brand', brandSchema);
export const CouponModel = mongoose.model('Coupon', couponSchema);
export const ReviewModel = mongoose.model('Review', reviewSchema);
export const CategoryModel = mongoose.model('Category', categorySchema);

// Refresh Token Schema (for rotation and validation)
const refreshTokenSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  family: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true }
});

// TTL index to automatically delete expired documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Admin 2FA Settings Schema
const admin2faSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  secret: { type: String, required: true },
  backupCodes: [{ type: String }],
  enabled: { type: Boolean, default: false },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

// Pending 2FA Login Session Schema
const pending2faSchema = new Schema({
  tempToken: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

// TTL index to expire pending tokens in 5 minutes
pending2faSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema);
export const Admin2FAModel = mongoose.model('Admin2FA', admin2faSchema);
export const Pending2FAModel = mongoose.model('Pending2FA', pending2faSchema);

const auditLogSchema = new Schema({
  action: { type: String, required: true, index: true },
  entity: { type: String, required: true },
  entityId: { type: String },
  user: { type: String },
  role: { type: String },
  success: { type: Boolean, required: true, default: true },
  details: { type: String }
}, { timestamps: true });

export const AuditLogModel = mongoose.model('AuditLog', auditLogSchema);

