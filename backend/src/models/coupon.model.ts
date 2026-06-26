import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number; // relevant for percentage discounts
  expiryDate: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true },
    minOrderValue: { type: Number, required: true, default: 0 },
    maxDiscount: { type: Number },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model<ICoupon>('Coupon', CouponSchema);
