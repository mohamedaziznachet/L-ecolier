// server/src/repositories/couponRepository.ts
import { CouponModel } from '../models/index.ts';

export async function getAllCoupons() {
  // Auto-deactivate expired coupons before returning
  await CouponModel.updateMany(
    { expiresAt: { $lte: new Date() }, isActive: true },
    { $set: { isActive: false } }
  );
  return CouponModel.find({}).sort({ createdAt: -1 }).lean();
}

export async function getCouponById(id: string) {
  return CouponModel.findById(id).lean();
}

export async function getCouponByCode(code: string) {
  await CouponModel.updateMany(
    { expiresAt: { $lte: new Date() }, isActive: true },
    { $set: { isActive: false } }
  );
  return CouponModel.findOne({ code: code.toUpperCase(), isActive: true }).lean();
}

export async function insertCoupon(data: {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  expiresAt: Date;
  isActive?: boolean;
}) {
  const coupon = new CouponModel(data);
  await coupon.save();
  return coupon._id.toString();
}

export async function updateCoupon(id: string, updates: Partial<{
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiresAt: Date;
  isActive: boolean;
}>) {
  return CouponModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
}

export async function deleteCoupon(id: string) {
  return CouponModel.findByIdAndDelete(id);
}

export async function validateCoupon(code: string, cartTotal: number) {
  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return { valid: false as const, error: "Code promo invalide ou expiré." };
  }

  if (coupon.maxUses > 0 && coupon.usageCount >= coupon.maxUses) {
    return { valid: false as const, error: "Ce code promo a atteint sa limite d'utilisation maximale." };
  }

  if (coupon.minOrderAmount > cartTotal) {
    return { valid: false as const, error: `Montant minimum de commande non atteint : ${coupon.minOrderAmount} DT requis.` };
  }

  const discountAmount = coupon.discountType === "percentage"
    ? Math.round(cartTotal * (coupon.discountValue / 100) * 1000) / 1000
    : Math.min(coupon.discountValue, cartTotal);

  return { valid: true as const, coupon, discountAmount };
}
