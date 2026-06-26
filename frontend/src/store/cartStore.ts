import { create } from 'zustand';

export interface ICartItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    discountPrice?: number;
    unit: string;
    images: string[];
    stock: number;
  };
  quantity: number;
}

export interface ICouponDetails {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
}

interface CartState {
  items: ICartItem[];
  coupon: ICouponDetails | null;
  addToCart: (product: ICartItem['product'], quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: ICouponDetails) => void;
  removeCoupon: () => void;
  getTotals: () => {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    grandTotal: number;
  };
}

const loadCart = (): ICartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const savedCart = localStorage.getItem('fk_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch {
    return [];
  }
};

const saveCart = (items: ICartItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fk_cart', JSON.stringify(items));
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: loadCart(),
  coupon: null,

  addToCart: (product, quantity = 1) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(item => item.product._id === product._id);
      let updatedItems;

      if (existingItemIndex > -1) {
        updatedItems = [...state.items];
        const newQty = updatedItems[existingItemIndex].quantity + quantity;
        // Clamp to stock limits
        updatedItems[existingItemIndex].quantity = Math.min(newQty, product.stock);
      } else {
        updatedItems = [...state.items, { product, quantity: Math.min(quantity, product.stock) }];
      }

      saveCart(updatedItems);
      return { items: updatedItems };
    });
  },

  removeFromCart: (productId) => {
    set((state) => {
      const updatedItems = state.items.filter(item => item.product._id !== productId);
      saveCart(updatedItems);
      return { items: updatedItems };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const updatedItems = state.items.filter(item => item.product._id !== productId);
        saveCart(updatedItems);
        return { items: updatedItems };
      }

      const updatedItems = state.items.map(item => {
        if (item.product._id === productId) {
          return { ...item, quantity: Math.min(quantity, item.product.stock) };
        }
        return item;
      });

      saveCart(updatedItems);
      return { items: updatedItems };
    });
  },

  clearCart: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fk_cart');
    }
    set({ items: [], coupon: null });
  },

  applyCoupon: (coupon) => {
    set({ coupon });
  },

  removeCoupon: () => {
    set({ coupon: null });
  },

  getTotals: () => {
    const { items, coupon } = get();
    
    // Subtotal calculation
    const subtotal = items.reduce((sum, item) => {
      const activePrice = item.product.discountPrice || item.product.price;
      return sum + activePrice * item.quantity;
    }, 0);

    // GST/Tax (5% GST standard)
    const tax = Math.round(subtotal * 0.05);

    // Delivery Fee (29 INR flat, free delivery on orders above 500 INR)
    const deliveryFee = subtotal === 0 || subtotal > 500 ? 0 : 29;

    // Coupon discount calculation
    let discount = 0;
    if (coupon && subtotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'flat') {
        discount = coupon.discountValue;
      } else if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      }
      discount = Math.min(discount, subtotal);
    }

    const grandTotal = Math.max(0, subtotal + tax + deliveryFee - discount);

    return {
      subtotal,
      tax,
      deliveryFee,
      discount,
      grandTotal
    };
  }
}));
