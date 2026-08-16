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
  applicableCategories?: string[];
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
  applicableCategories: string[];
}>) {
  return CouponModel.findByIdAndUpdate(id, updates, { returnDocument: 'after', runValidators: true });
}

export async function deleteCoupon(id: string) {
  return CouponModel.findByIdAndDelete(id);
}

export async function validateCoupon(
  code: string,
  cartTotal: number,
  items?: Array<{ category?: string; price?: number; priceNum?: number; quantity?: number; subtotal?: number }>
) {
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

  const appCats: string[] = (coupon as any).applicableCategories || [];
  let eligibleTotal = cartTotal;

  if (appCats.length > 0) {
    if (items && items.length > 0) {
      const eligibleItems = items.filter(item => item.category && appCats.includes(item.category));
      if (eligibleItems.length === 0) {
        return {
          valid: false as const,
          error: `Ce code promo ne s'applique qu'aux catégories suivantes : ${appCats.join(', ')}.`
        };
      }
      eligibleTotal = eligibleItems.reduce((acc, item) => {
        const itemPrice = Number(item.priceNum ?? item.price ?? 0);
        const itemSubtotal = item.subtotal ?? (itemPrice * Number(item.quantity || 1));
        return acc + itemSubtotal;
      }, 0);
    }
  }

  const discountAmount = coupon.discountType === "percentage"
    ? Math.round(eligibleTotal * (coupon.discountValue / 100) * 1000) / 1000
    : Math.min(coupon.discountValue, eligibleTotal);

  return { valid: true as const, coupon, discountAmount, applicableCategories: appCats };
}
