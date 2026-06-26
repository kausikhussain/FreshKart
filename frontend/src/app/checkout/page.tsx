'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, MapPin, Ticket, CreditCard, Landmark, Truck, CheckCircle2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore, IAddress } from '@/store/authStore';
import { apiRequest } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setAddresses } = useAuthStore();
  const { items, coupon, applyCoupon, removeCoupon, getTotals, clearCart } = useCartStore();

  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<IAddress, '_id'>>({
    label: 'Home',
    street: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    zipCode: '',
    country: 'India',
    isDefault: false
  });

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay' | 'cod'>('cod');
  const [deliverySlot, setDeliverySlot] = useState('Within 10-15 mins');

  // Simulated gateway loading states
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccessPopup, setPaymentSuccessPopup] = useState(false);

  const { subtotal, tax, deliveryFee, discount, grandTotal } = getTotals();

  // 1. Add Address Mutation
  const addAddressMutation = useMutation({
    mutationFn: (addr: Omit<IAddress, '_id'>) =>
      apiRequest<IAddress[]>('/auth/address', {
        method: 'POST',
        body: JSON.stringify(addr)
      }),
    onSuccess: (updatedAddresses) => {
      setAddresses(updatedAddresses);
      setShowNewAddressForm(false);
      setNewAddress({
        label: 'Home',
        street: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '',
        country: 'India',
        isDefault: false
      });
      setSelectedAddressIndex(updatedAddresses.length - 1);
    }
  });

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.zipCode) return;
    addAddressMutation.mutate(newAddress);
  };

  // 2. Validate Coupon Mutation
  const validateCouponMutation = useMutation({
    mutationFn: (code: string) =>
      apiRequest<{
        code: string;
        discount: number;
        minOrderValue: number;
        discountType: 'percentage' | 'flat';
        discountValue: number;
        maxDiscount?: number;
      }>('/orders/coupon/validate', {
        method: 'POST',
        body: JSON.stringify({ code, cartAmount: subtotal })
      }),
    onSuccess: (res) => {
      applyCoupon({
        code: res.code,
        discountType: res.discountType,
        discountValue: res.discountValue,
        minOrderValue: res.minOrderValue,
        maxDiscount: res.maxDiscount
      });
      setCouponSuccess(`Coupon ${res.code} applied successfully! Saving ₹${res.discount}`);
      setCouponError('');
    },
    onError: (err: any) => {
      setCouponError(err.message || 'Invalid coupon code');
      setCouponSuccess('');
    }
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    validateCouponMutation.mutate(couponCode);
  };

  // 3. Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderPayload: any) =>
      apiRequest<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      }),
    onSuccess: (order) => {
      clearCart();
      router.push(`/orders/${order._id}/track`);
    }
  });

  const handlePlaceOrder = async () => {
    const addresses = user?.addresses || [];
    const activeAddress = addresses[selectedAddressIndex];

    if (!activeAddress) {
      alert('Please add or select a delivery address');
      return;
    }

    const orderPayload = {
      items: items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity
      })),
      deliveryAddress: {
        label: activeAddress.label,
        street: activeAddress.street,
        city: activeAddress.city,
        state: activeAddress.state,
        zipCode: activeAddress.zipCode,
        country: activeAddress.country,
        coordinates: activeAddress.coordinates || { lat: 12.9716, lng: 77.5946 }
      },
      paymentGateway: paymentMethod,
      couponCode: coupon?.code || undefined,
      deliverySlot
    };

    if (paymentMethod !== 'cod') {
      // Simulate real-time stripe / razorpay card checkouts
      setPaymentLoading(true);
      setTimeout(() => {
        setPaymentLoading(false);
        setPaymentSuccessPopup(true);
        setTimeout(() => {
          setPaymentSuccessPopup(false);
          createOrderMutation.mutate(orderPayload);
        }, 1500);
      }, 2500);
    } else {
      createOrderMutation.mutate(orderPayload);
    }
  };

  return (
    <Layout>
      <h1 className="font-heading text-3xl font-black text-slate-900 dark:text-white mb-8">Checkout</h1>

      {paymentLoading && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-5 text-center max-w-sm mx-4">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Connecting Gateway...</h3>
            <p className="text-xs text-slate-400">Processing ₹{grandTotal} securely. Please do not close or reload this window.</p>
          </div>
        </div>
      )}

      {paymentSuccessPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4">
            <div className="text-emerald-500 bg-emerald-500/10 p-4 rounded-full animate-scale">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Payment Received!</h3>
            <p className="text-xs text-slate-400">Your order has been verified. Dispatching delivery agent.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Address Selection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                Delivery Address
              </h2>
              {!showNewAddressForm && (
                <button
                  onClick={() => setShowNewAddressForm(true)}
                  className="text-xs font-bold text-emerald-500 hover:text-emerald-600"
                >
                  + Add New
                </button>
              )}
            </div>

            {showNewAddressForm ? (
              <form onSubmit={handleAddAddress} className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Address Tag</label>
                    <select
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200"
                    >
                      <option>Home</option>
                      <option>Work</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Zip Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 560034"
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="Flat/House number, Floor, Apartment/Street details"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-bold"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(false)}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : user?.addresses?.length === 0 ? (
              <p className="text-xs text-slate-400">No saved addresses. Click &apos;+ Add New&apos; above to enter your street address.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user?.addresses?.map((addr, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAddressIndex(idx)}
                    className={`border p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between ${selectedAddressIndex === idx ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-800'}`}
                  >
                    <div className="text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-150 mb-1 capitalize">{addr.label}</p>
                      <p className="text-[10px] text-slate-400 leading-normal">{addr.street}, {addr.city}</p>
                      <p className="text-[10px] text-slate-400">{addr.zipCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Slot Selection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs">
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Truck className="w-5 h-5 text-emerald-500" />
              Delivery Slot
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div
                onClick={() => setDeliverySlot('Within 10-15 mins')}
                className={`border p-4 rounded-2xl cursor-pointer transition-all ${deliverySlot === 'Within 10-15 mins' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-100 dark:border-slate-850'}`}
              >
                <p className="font-bold text-slate-800 dark:text-slate-150">Instant Quick Delivery</p>
                <p className="text-[10px] text-slate-400">Arrives at your flat in 10-15 mins. Free above ₹500.</p>
              </div>

              <div
                onClick={() => setDeliverySlot('Tomorrow Morning')}
                className={`border p-4 rounded-2xl cursor-pointer transition-all ${deliverySlot === 'Tomorrow Morning' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-100 dark:border-slate-850'}`}
              >
                <p className="font-bold text-slate-800 dark:text-slate-150">Next-Day Scheduled</p>
                <p className="text-[10px] text-slate-400">Delivery scheduled for 7 AM - 9 AM tomorrow.</p>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs">
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              Payment Methods
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`border p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-24 ${paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-100 dark:border-slate-850'}`}
              >
                <Landmark className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-bold text-slate-850 dark:text-slate-150">Cash on Delivery</p>
                  <p className="text-[9px] text-slate-400">Pay cash/UPI at door</p>
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod('stripe')}
                className={`border p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-24 ${paymentMethod === 'stripe' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-100 dark:border-slate-850'}`}
              >
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-bold text-slate-850 dark:text-slate-150">Stripe Card</p>
                  <p className="text-[9px] text-slate-400">Visa, Mastercard, Amex</p>
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod('razorpay')}
                className={`border p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-24 ${paymentMethod === 'razorpay' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-100 dark:border-slate-850'}`}
              >
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="font-bold text-slate-850 dark:text-slate-150">Razorpay UPI</p>
                  <p className="text-[9px] text-slate-400">GPay, PhonePe, Paytm</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right side Billing review panel */}
        <div className="space-y-6">
          
          {/* Coupon Code section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs">
            <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Ticket className="w-4 h-4 text-emerald-500" />
              Apply Coupon Code
            </h3>

            {coupon ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-emerald-500 tracking-wider uppercase">{coupon.code}</p>
                  <p className="text-[10px] text-slate-400">Promotional discount active</p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME100, FRESH30"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 uppercase"
                  required
                />
                <button
                  type="submit"
                  disabled={validateCouponMutation.isPending}
                  className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}

            {couponError && <p className="text-[10px] text-red-500 mt-2 font-medium">{couponError}</p>}
            {couponSuccess && <p className="text-[10px] text-emerald-500 mt-2 font-medium">{couponSuccess}</p>}
          </div>

          {/* Pricing Breakdown and checkout trigger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs space-y-6">
            <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-850">
              Payment Breakdown
            </h3>

            <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Basket Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax & GST (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Discount code applied</span>
                  <span>-₹{discount}</span>
                </div>
              )}

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>

              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={createOrderMutation.isPending || items.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 text-sm disabled:opacity-50"
            >
              Place Order & Pay
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </Layout>
  );
}
