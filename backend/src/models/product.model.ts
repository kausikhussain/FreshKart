import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  unit: string; // e.g., '500 g', '1 kg', '1 pc', '250 ml'
  images: string[];
  category: mongoose.Types.ObjectId; // References Category
  subcategory?: mongoose.Types.ObjectId; // References Category
  stock: number;
  status: 'active' | 'draft';
  isTrending: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    unit: { type: String, required: true },
    images: { type: [String], required: true, default: [] },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    stock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['active', 'draft'], default: 'active' },
    isTrending: { type: Boolean, default: false },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Indexing for search
ProductSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);
