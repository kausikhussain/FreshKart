'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bike, ShieldCheck, MapPin, CheckCircle, PackageCheck, AlertCircle, Sparkles, Send } from 'lucide-react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface ActiveOrder {
  _id: string;
  status: string;
  totals: { grandTotal: number };
  user: { name: string; phone: string };
  deliveryAddress: { label: string; street: string; zipCode: string };
  items: Array<{ product: { name: string }; quantity: number }>;
  deliveryPartner?: { _id: string; name: string };
}

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [otpVerifyOrderId, setOtpVerifyOrderId] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // 1. Fetch Orders for Courier
  const { data: activeOrders = [], isLoading } = useQuery<ActiveOrder[]>({
    queryKey: ['delivery-orders'],
    queryFn: () => apiRequest<ActiveOrder[]>('/orders/active'),
    refetchInterval: 5000 // refetch delivery queue every 5s
  });

  // 2. Accept Run Mutation
  const acceptRunMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest<any>(`/orders/${orderId}/assign`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    }
  });

  // 3. Status Transition Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string }) =>
      apiRequest<any>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    }
  });

  // 4. Verify OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: ({ id, otp }: { id: string; otp: string }) =>
      apiRequest<any>(`/orders/${id}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ otp })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      setOtpVerifyOrderId(null);
      setEnteredOtp('');
      setOtpError('');
    },
    onError: (err: any) => {
      setOtpError(err.message || 'OTP verification failed. Check code.');
    }
  });

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp || !otpVerifyOrderId) return;
    verifyOtpMutation.mutate({ id: otpVerifyOrderId, otp: enteredOtp });
  };

  const myAssignedOrders = activeOrders.filter((ord) => ord.deliveryPartner?._id === user?.id);
  const unassignedOrders = activeOrders.filter((ord) => !ord.deliveryPartner);

  if (!user || user.role !== 'delivery') {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="font-heading text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Access Denied</h2>
          <p className="text-slate-400 text-xs mb-6">Only registered couriers are allowed to access this console.</p>
          <button onClick={() => router.push('/')} className="bg-emerald-500 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs">
            Go Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Courier Hub
            <Bike className="w-7 h-7 text-emerald-500" />
          </h1>
          <p className="text-xs text-slate-400">Manage dispatch runs, packaging, and verify arrival codes</p>
        </div>
      </div>

      {/* OTP verification popup modal overlay */}
      {otpVerifyOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
          <form
            onSubmit={handleVerifyOtpSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4 text-xs"
          >
            <ShieldCheck className="w-12 h-12 text-emerald-500 fill-emerald-500/10 animate-pulse" />
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">Verify Delivery Run</h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Enter the 4-digit code provided by the customer to complete this checkout run.</p>
            </div>

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-2.5 rounded-xl font-medium w-full flex items-center gap-1.5 justify-center">
                <AlertCircle className="w-4 h-4" />
                {otpError}
              </div>
            )}

            <input
              type="text"
              placeholder="e.g. 4390"
              maxLength={4}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 tracking-[0.4em] font-mono text-xl font-bold py-2.5 rounded-2xl text-center max-w-[150px] focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-150"
              required
            />

            <div className="flex gap-4 w-full pt-2">
              <button
                type="submit"
                disabled={verifyOtpMutation.isPending}
                className="flex-1 bg-emerald-505 bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                Confirm OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpVerifyOrderId(null);
                  setEnteredOtp('');
                  setOtpError('');
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-2.5 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main split queue panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Runs assigned to me */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <PackageCheck className="w-5 h-5 text-emerald-500" />
              My Active Deliveries ({myAssignedOrders.length})
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Orders you accepted. Coordinate milestones.</p>
          </div>

          {isLoading ? (
            <p className="text-xs text-slate-450">Loading assignments...</p>
          ) : myAssignedOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-100 dark:border-slate-850 rounded-2xl">
              No active deliveries assigned. Grab runs from the pool on the right!
            </p>
          ) : (
            <div className="space-y-4 text-xs">
              {myAssignedOrders.map((ord) => (
                <div key={ord._id} className="border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-850 pb-2">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">Order #{ord._id.substring(ord._id.length - 8)}</p>
                      <p className="text-[9px] text-slate-400 font-medium">Customer: {ord.user.name}</p>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded text-[9px] uppercase">
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                      <span>{ord.deliveryAddress.street}, {ord.deliveryAddress.label}</span>
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-250">
                      Items: {ord.items.map((it) => `${it.product.name} (x${it.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div className="flex gap-3 flex-wrap pt-2">
                    {ord.status === 'confirmed' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: ord._id,
                            status: 'packed',
                            note: 'Driver packed your items. Getting ready to deliver.'
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-[10px]"
                      >
                        Set Packed
                      </button>
                    )}

                    {ord.status === 'packed' && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: ord._id,
                            status: 'out-for-delivery',
                            note: 'Driver has picked up items and is on the way.'
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-[10px]"
                      >
                        Set Out for Delivery
                      </button>
                    )}

                    {ord.status === 'out-for-delivery' && (
                      <button
                        onClick={() => setOtpVerifyOrderId(ord._id)}
                        className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-[10px] shadow-sm flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verify OTP & Deliver
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unassigned Pool */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/10" />
              Unassigned Delivery Pool ({unassignedOrders.length})
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Orders looking for a nearby delivery agent</p>
          </div>

          {isLoading ? (
            <p className="text-xs text-slate-455">Loading pool...</p>
          ) : unassignedOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-100 dark:border-slate-850 rounded-2xl">
              No orders waiting in pool. Check back soon.
            </p>
          ) : (
            <div className="space-y-3.5 text-xs">
              {unassignedOrders.map((ord) => (
                <div key={ord._id} className="border border-slate-100 dark:border-slate-850 rounded-2xl p-4 flex justify-between gap-4 items-center flex-wrap">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Order ID: #{ord._id.substring(ord._id.length - 8)}</p>
                    <p className="text-[9px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      {ord.deliveryAddress.street.split(',')[0]} ({ord.deliveryAddress.label})
                    </p>
                  </div>

                  <button
                    onClick={() => acceptRunMutation.mutate(ord._id)}
                    disabled={acceptRunMutation.isPending}
                    className="bg-emerald-555 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-[10px] shadow-sm flex items-center gap-1"
                  >
                    Accept Run
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
