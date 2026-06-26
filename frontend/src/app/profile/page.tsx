'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, MapPin, ClipboardList, Trash2, ShieldCheck, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';
import { useAuthStore, IAddress } from '@/store/authStore';

interface OrderItem {
  product: {
    name: string;
    images: string[];
  };
  quantity: number;
}

interface Order {
  _id: string;
  createdAt: string;
  status: string;
  totals: { grandTotal: number };
  items: OrderItem[];
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateUser, setAddresses, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('orders');

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // 1. Fetch Order History
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: () => apiRequest<Order[]>('/orders/my'),
    enabled: !!user
  });

  // 2. Profile update mutation
  const profileMutation = useMutation({
    mutationFn: (updates: { name: string; phone: string }) =>
      apiRequest<any>('/auth/profile/update', {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    onSuccess: (updatedUser) => {
      updateUser({ name: updatedUser.name, phone: updatedUser.phone });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ name, phone });
  };

  // 3. Delete Address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) =>
      apiRequest<IAddress[]>(`/auth/address/${addressId}`, {
        method: 'DELETE'
      }),
    onSuccess: (updatedAddresses) => {
      setAddresses(updatedAddresses);
    }
  });

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="font-heading text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Access Denied</h2>
          <p className="text-slate-400 text-xs mb-6">Please log in to view your profile and order history.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-emerald-505 bg-emerald-500 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs"
          >
            Go to Login
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row gap-8 py-4">
        
        {/* Left Side Tab Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 h-fit shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-150 text-xs">{user.name}</h3>
              <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-350">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-colors font-medium ${activeTab === 'orders' ? 'bg-emerald-500/10 text-emerald-600 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-850'}`}
            >
              <ClipboardList className="w-4 h-4" />
              Order History
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-colors font-medium ${activeTab === 'addresses' ? 'bg-emerald-500/10 text-emerald-600 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-850'}`}
            >
              <MapPin className="w-4 h-4" />
              Saved Addresses
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-colors font-medium ${activeTab === 'profile' ? 'bg-emerald-500/10 text-emerald-600 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-850'}`}
            >
              <User className="w-4 h-4" />
              Personal Info
            </button>
          </div>

          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full mt-4 border border-red-500/20 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 py-2.5 rounded-xl text-xs font-bold transition-all text-center"
          >
            Log Out Account
          </button>
        </aside>

        {/* Right Side Content Tab */}
        <div className="flex-1">
          
          {/* Order history Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-black text-slate-900 dark:text-white">Your Orders</h2>
                <p className="text-xs text-slate-400">View live status or inspect items from your past orders</p>
              </div>

              {ordersLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 bg-slate-100 dark:bg-slate-900 rounded-3xl"></div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-10 text-center text-slate-400 text-xs">
                  <ClipboardList className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-800 mb-3" />
                  <p>You haven&apos;t placed any orders yet. Place some items in your cart to begin!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord._id}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center"
                    >
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-150">Order #{ord._id.substring(ord._id.length - 8)}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${ord.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : ord.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'}`}>
                            {ord.status}
                          </span>
                        </div>
                        
                        <p className="text-slate-400 text-[10px] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </p>
                        
                        <p className="text-slate-450 dark:text-slate-400 font-semibold line-clamp-1 max-w-[250px]">
                          {ord.items.map((it) => `${it.product.name} (x${it.quantity})`).join(', ')}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-start sm:items-end justify-between w-full sm:w-auto gap-4">
                        <span className="font-heading font-black text-slate-900 dark:text-white text-base">₹{ord.totals.grandTotal}</span>
                        {ord.status !== 'delivered' && ord.status !== 'cancelled' ? (
                          <button
                            onClick={() => router.push(`/orders/${ord._id}/track`)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
                          >
                            Live Track
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-450 dark:text-slate-500">Order Completed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-black text-slate-900 dark:text-white">Saved Addresses</h2>
                <p className="text-xs text-slate-400">Manage tags and drop-off coordinates</p>
              </div>

              {user.addresses?.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-10 text-center text-slate-400 text-xs">
                  <MapPin className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-800 mb-3" />
                  <p>You haven&apos;t saved any addresses yet. Add one during checkout to save here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.addresses?.map((addr) => (
                    <div
                      key={addr._id}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs flex justify-between gap-4"
                    >
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-slate-850 dark:text-slate-200 capitalize flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          {addr.label}
                          {addr.isDefault && <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase ml-1.5">Default</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal">{addr.street}, {addr.city}</p>
                        <p className="text-[10px] text-slate-400">{addr.zipCode}</p>
                      </div>
                      
                      <button
                        onClick={() => deleteAddressMutation.mutate(addr._id || '')}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/20 dark:hover:bg-red-950/30 rounded-xl transition-colors h-fit self-center"
                        title="Delete address"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Personal Info Edit Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-black text-slate-900 dark:text-white">Personal Information</h2>
                <p className="text-xs text-slate-400">View and update your name and mobile phone details</p>
              </div>

              <form onSubmit={handleProfileSave} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs max-w-lg space-y-4 text-xs">
                {profileSuccess && (
                  <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 p-3.5 rounded-2xl flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Profile updated successfully!
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address (Non-editable)
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-400 dark:text-slate-550 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                    <User className="w-4.5 h-4.5 text-slate-450" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-grow bg-transparent ml-3 text-slate-850 dark:text-slate-150 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Mobile Phone
                  </label>
                  <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                    <Phone className="w-4.5 h-4.5 text-slate-450" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-grow bg-transparent ml-3 text-slate-850 dark:text-slate-150 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 text-xs disabled:opacity-50"
                >
                  Save Profile Updates
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}
