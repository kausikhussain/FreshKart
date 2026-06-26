'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBasket, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/lib/api';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  unit: string;
  images: string[];
  stock: number;
  rating: number;
}

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, updateQuantity, removeFromCart, getTotals } = useCartStore();

  const { subtotal, tax, deliveryFee, discount, grandTotal } = getTotals();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch some products to suggest for cross-selling
  const { data: recommendations = [] } = useQuery<Product[]>({
    queryKey: ['cart-recommendations'],
    queryFn: async () => {
      const res = await apiRequest<{ products: Product[] }>('/products', { params: { limit: 6 } });
      return res.products;
    },
    placeholderData: []
  });

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=checkout');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <Layout>
      <h1 className="font-heading text-3xl font-black text-slate-900 dark:text-white mb-8">My Shopping Basket</h1>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center mb-12 shadow-xs">
          <div className="bg-emerald-500/10 p-5 rounded-full text-emerald-500 mb-4 animate-bounce">
            <ShoppingBasket className="w-12 h-12" />
          </div>
          <h2 className="text-lg font-bold text-slate-850 dark:text-slate-200 mb-1">Your basket is empty</h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">Explore our fresh farm tomatoes, milk, breads, snacks, and place items in your cart to order.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-md"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const activePrice = item.product.discountPrice || item.product.price;
              return (
                <div
                  key={item.product._id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-xs"
                >
                  {/* Product thumbnail */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden p-2 border border-slate-100 dark:border-slate-800 flex-shrink-0 flex items-center justify-center">
                      <img src={item.product.images[0]} alt={item.product.name} className="max-h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-1">
                        {item.product.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold mb-1">{item.product.unit}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">₹{activePrice}</span>
                        {item.product.discountPrice && (
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 line-through">₹{item.product.price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500 text-slate-950 rounded-xl flex items-center shadow-md overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        className="hover:bg-emerald-600 p-1.5 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-bold min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="hover:bg-emerald-600 p-1.5 transition-colors disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product._id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/20 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs h-fit space-y-6">
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Bill Details
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Basket Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Taxes & GST (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Delivery Charges</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-500 font-bold">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-500 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>

              <div className="flex items-center justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>To Pay</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-sm"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {subtotal < 500 && (
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Tip: Add items worth <span className="font-bold text-slate-700 dark:text-slate-200">₹{500 - subtotal}</span> more to get <span className="font-bold text-emerald-500">FREE delivery</span>!
              </p>
            )}
          </div>

        </div>
      )}

      {/* Suggested Items */}
      {recommendations.length > 0 && (
        <section className="mb-6">
          <h2 className="font-heading text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-6">
            Quick Add Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recommendations.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
