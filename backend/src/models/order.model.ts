import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // captured at the time of purchase
}

export interface ITrackingUpdate {
  status: 'pending' | 'confirmed' | 'packed' | 'out-for-delivery' | 'delivered' | 'cancelled';
  timestamp?: Date;
  note?: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  deliveryAddress: {
    label: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  paymentDetails: {
    gateway: 'stripe' | 'razorpay' | 'cod';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
  };
  totals: {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    grandTotal: number;
  };
  status: 'pending' | 'confirmed' | 'packed' | 'out-for-delivery' | 'delivered' | 'cancelled';
  deliveryPartner?: mongoose.Types.ObjectId; // References User
  deliverySlot?: string; // e.g. "Within 10-15 mins"
  trackingUpdates: ITrackingUpdate[];
  otpForDelivery: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }
});

const TrackingUpdateSchema = new Schema<ITrackingUpdate>({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'out-for-delivery', 'delivered', 'cancelled'],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  note: { type: String }
});

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    deliveryAddress: {
      label: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    paymentDetails: {
      gateway: { type: String, enum: ['stripe', 'razorpay', 'cod'], required: true },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      transactionId: { type: String }
    },
    totals: {
      subtotal: { type: Number, required: true },
      tax: { type: Number, required: true, default: 0 },
      deliveryFee: { type: Number, required: true, default: 0 },
      discount: { type: Number, required: true, default: 0 },
      grandTotal: { type: Number, required: true }
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'packed', 'out-for-delivery', 'delivered', 'cancelled'],
      default: 'pending'
    },
    deliveryPartner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deliverySlot: { type: String, default: 'Within 10 mins' },
    trackingUpdates: [TrackingUpdateSchema],
    otpForDelivery: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
