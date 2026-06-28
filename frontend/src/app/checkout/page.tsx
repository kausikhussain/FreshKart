'use client';

import React, { useState, useEffect } from 'react';
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

  // Credit Card Form States
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  // 3DS Verification Modal States
  const [show3dsModal, setShow3dsModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  // UPI Request Modal State
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiTimer, setUpiTimer] = useState(15);

  const [paymentFormErrors, setPaymentFormErrors] = useState<Record<string, string>>({});

  const { subtotal, tax, deliveryFee, discount, grandTotal } = getTotals();

  // Luhn algorithm card check
  const validateLuhn = (num: string) => {
    const sanitized = num.replace(/\s+/g, '');
    if (!/^\d+$/.test(sanitized)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i));
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

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

    setPaymentFormErrors({});
    const errors: Record<string, string> = {};

    if (paymentMethod === 'stripe') {
      if (!cardName.trim()) errors.cardName = 'Cardholder name is required';
      if (!cardNumber.trim()) {
        errors.cardNumber = 'Card number is required';
      } else if (!validateLuhn(cardNumber)) {
        errors.cardNumber = 'Invalid card number (fails Luhn algorithm)';
      }
      
      const cardExpiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!cardExpiry.trim()) {
        errors.cardExpiry = 'Expiry date is required';
      } else if (!cardExpiryPattern.test(cardExpiry)) {
        errors.cardExpiry = 'Must be in MM/YY format';
      } else {
        const [month, year] = cardExpiry.split('/').map(Number);
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          errors.cardExpiry = 'Card has expired';
        }
      }

      if (!cardCvv.trim()) {
        errors.cardCvv = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(cardCvv)) {
        errors.cardCvv = 'Must be 3 or 4 digits';
      }
    } else if (paymentMethod === 'razorpay') {
      const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiId.trim()) {
        errors.upiId = 'UPI ID is required';
      } else if (!upiPattern.test(upiId)) {
        errors.upiId = 'Invalid UPI ID format (e.g. name@okaxis)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setPaymentFormErrors(errors);
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

    if (paymentMethod === 'stripe') {
      // Generate 6-digit mock bank code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setUserOtpInput('');
      setOtpError('');
      setShow3dsModal(true);
    } else if (paymentMethod === 'razorpay') {
      setShowUpiModal(true);
      setUpiTimer(8);
    } else {
      createOrderMutation.mutate(orderPayload);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (userOtpInput === generatedOtp || userOtpInput === '123456') {
      setShow3dsModal(false);
      setPaymentLoading(true);
      setTimeout(() => {
        setPaymentLoading(false);
        setPaymentSuccessPopup(true);
        setTimeout(() => {
          setPaymentSuccessPopup(false);
          const activeAddress = (user?.addresses || [])[selectedAddressIndex];
          createOrderMutation.mutate({
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
            paymentGateway: 'stripe',
            couponCode: coupon?.code || undefined,
            deliverySlot
          });
        }, 1500);
      }, 1000);
    } else {
      setOtpError('Invalid 3D Secure verification code. Please check the mock SMS banner.');
    }
  };

  useEffect(() => {
    if (!showUpiModal) return;
    if (upiTimer <= 0) {
      setShowUpiModal(false);
      setPaymentSuccessPopup(true);
      setTimeout(() => {
        setPaymentSuccessPopup(false);
        const activeAddress = (user?.addresses || [])[selectedAddressIndex];
        createOrderMutation.mutate({
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
          paymentGateway: 'razorpay',
          couponCode: coupon?.code || undefined,
          deliverySlot
        });
      }, 1500);
      return;
    }
    const timer = setTimeout(() => {
      setUpiTimer(upiTimer - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [showUpiModal, upiTimer]);

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

            {/* Simulated interactive Card details inputs */}
            {paymentMethod === 'stripe' && (
              <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-6 text-xs space-y-4 animate-fade-in text-slate-850 dark:text-slate-200">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Credit / Debit Card Details
                </h3>
                
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                    {paymentFormErrors.cardName && <p className="text-[10px] text-red-500 mt-1 font-medium">{paymentFormErrors.cardName}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4111 1111 1111 1111"
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                        setCardNumber(formatted.slice(0, 19));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-medium tracking-widest"
                    />
                    {paymentFormErrors.cardNumber && <p className="text-[10px] text-red-500 mt-1 font-medium">{paymentFormErrors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 2) {
                            val = val.slice(0, 2) + '/' + val.slice(2, 4);
                          }
                          setCardExpiry(val.slice(0, 5));
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                      {paymentFormErrors.cardExpiry && <p className="text-[10px] text-red-500 mt-1 font-medium">{paymentFormErrors.cardExpiry}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono tracking-widest font-medium"
                      />
                      {paymentFormErrors.cardCvv && <p className="text-[10px] text-red-500 mt-1 font-medium">{paymentFormErrors.cardCvv}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Simulated UPI ID inputs */}
            {paymentMethod === 'razorpay' && (
              <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-6 text-xs space-y-4 animate-fade-in text-slate-850 dark:text-slate-200">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-emerald-500" />
                  Razorpay UPI Payment
                </h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase mb-1">Enter UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. johndoe@okaxis"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                  {paymentFormErrors.upiId && <p className="text-[10px] text-red-500 mt-1 font-medium">{paymentFormErrors.upiId}</p>}
                </div>
              </div>
            )}
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

      {/* Simulated 3D-Secure card verification portal */}
      {show3dsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center font-sans text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-6 max-w-md w-full mx-4 relative overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="font-heading font-black text-slate-950 dark:text-white text-base">Secure Gateway Check</h3>
                <p className="text-[10px] text-slate-400">Verified by Visa / Mastercard ID Check</p>
              </div>
              <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[8px] font-bold">MOCK GATEWAY</span>
            </div>

            {/* Simulated SMS Alert widget */}
            <div className="bg-slate-950/90 dark:bg-black text-emerald-400 p-3.5 rounded-2xl border border-emerald-500/20 text-[10px] space-y-1 select-none">
              <p className="font-bold flex items-center gap-1.5 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                BANK SMS SIMULATOR (Mock SMS alert)
              </p>
              <p className="leading-relaxed opacity-90">
                Your security OTP code for payment of <span className="font-extrabold text-white">₹{grandTotal}</span> to FreshKart is: <span className="font-black text-white bg-slate-850 px-2 py-0.5 rounded text-xs select-all border border-white/10">{generatedOtp}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  value={userOtpInput}
                  onChange={(e) => setUserOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 px-3.5 py-3 rounded-xl text-center text-lg font-black tracking-widest text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
                {otpError && <p className="text-[10px] text-red-500 mt-1 text-center font-medium leading-normal">{otpError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShow3dsModal(false)}
                  className="flex-grow bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-850 text-slate-550 dark:text-slate-350 font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-2xl transition-all cursor-pointer text-center"
                >
                  Confirm & Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated UPI Request Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center font-sans text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center text-center gap-5 max-w-sm w-full mx-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <Landmark className="w-6 h-6 text-emerald-500 absolute" />
            </div>

            <div>
              <h3 className="font-heading font-black text-slate-900 dark:text-white text-base">Awaiting UPI Approval</h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Open your mobile UPI app (GPay / PhonePe / Paytm) to approve the collect request of ₹{grandTotal}.</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-4 py-2.5 rounded-2xl w-full">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Autosubmitting in {upiTimer} seconds...</p>
            </div>

            <button
              onClick={() => setShowUpiModal(false)}
              className="w-full bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-850 text-slate-550 dark:text-slate-350 font-bold py-3 rounded-2xl transition-all cursor-pointer text-center"
            >
              Cancel Checkout
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
