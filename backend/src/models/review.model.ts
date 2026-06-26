import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId; // References User
  product: mongoose.Types.ObjectId; // References Product
  rating: number;
  comment: string;
  images?: string[];
  replyFromAdmin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    replyFromAdmin: { type: String }
  },
  { timestamps: true }
);

// Compound index so a user can only write one review per product
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
