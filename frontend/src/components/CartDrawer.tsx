'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, ShoppingBasket, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, getTotals } = useCartStore();

  const { subtotal, tax, deliveryFee, discount, grandTotal } = getTotals();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  const freeDeliveryThreshold = 500;
  const progressToFreeDelivery = Math.min((subtotal / freeDeliveryThreshold) * 100, 100);
  const amountLeftForFree = freeDeliveryThreshold - subtotal;

  const handleCheckoutClick = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <>
      {/* Overlay backdrop blur */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer slide-out panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col justify-between border-l border-slate-100 dark:border-slate-800/80 transition-all duration-300 font-sans text-xs">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="w-5 h-5 text-emerald-500" />
            <h2 className="font-heading text-base font-bold text-slate-900 dark:text-white">
              My Basket ({totalItems} items)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Free Shipping Progress bar */}
        {totalItems > 0 && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 px-6 py-3.5 border-b border-emerald-100/50 dark:border-emerald-950/10">
            {subtotal >= freeDeliveryThreshold ? (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                🎉 Congratulations! Your delivery charge is FREE!
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-650 dark:text-slate-350">
                  Add items worth <span className="font-bold text-slate-900 dark:text-white">₹{amountLeftForFree}</span> more to unlock <span className="font-bold text-emerald-500">FREE delivery</span>!
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressToFreeDelivery}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <ShoppingBasket className="w-12 h-12 text-slate-300 dark:text-slate-800 mb-3 animate-bounce" />
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Your basket is empty</p>
              <p className="text-[10px] max-w-[200px] leading-relaxed">Add fresh produce or breakfast munchies to start shopping!</p>
            </div>
          ) : (
            items.map((item) => {
              const activePrice = item.product.discountPrice || item.product.price;
              return (
                <div
                  key={item.product._id}
                  className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/40 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-xl p-1 flex-shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-850">
                      <img src={item.product.images[0]} alt={item.product.name} className="max-h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 dark:text-slate-150 line-clamp-1 max-w-[150px]">
                        {item.product.name}
                      </h4>
                      <p className="text-[9px] text-slate-400 mb-1">{item.product.unit}</p>
                      <span className="font-bold text-slate-900 dark:text-white">₹{activePrice}</span>
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center gap-2.5">
                    <div className="bg-emerald-500 text-slate-950 rounded-xl flex items-center overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        className="hover:bg-emerald-600 p-1 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-1.5 font-bold min-w-[15px] text-center text-[10px]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="hover:bg-emerald-600 p-1 transition-colors disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product._id)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Billing details */}
        {items.length > 0 && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (5%) & Delivery fee</span>
                <span>₹{tax + deliveryFee}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Coupons discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-50 dark:border-slate-850">
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 text-sm"
            >
              Checkout Order
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </>
  );
}
