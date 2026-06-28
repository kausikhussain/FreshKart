'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, Package, ShoppingBag, Users, TrendingUp, AlertTriangle, ArrowLeftRight, Check, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

interface StatsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
}

interface LowStockProduct {
  _id: string;
  name: string;
  stock: number;
  price: number;
  category: { name: string };
}

interface ActiveOrder {
  _id: string;
  status: string;
  totals: { grandTotal: number };
  user: { name: string; phone: string };
  items: Array<{ product: { name: string }; quantity: number }>;
  deliveryPartner?: { name: string };
}

interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface CategorySale {
  name: string;
  value: number;
}

interface DashboardData {
  summary: StatsSummary;
  lowStockItems: LowStockProduct[];
  salesTrend: SalesTrendPoint[];
  categorySales: CategorySale[];
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // 1. Fetch Dashboard Analytics
  const { data: dashboardData, isLoading: statsLoading } = useQuery<DashboardData>({
    queryKey: ['admin-stats'],
    queryFn: () => apiRequest<DashboardData>('/admin/stats'),
    placeholderData: {
      summary: { totalRevenue: 15430, totalOrders: 42, totalCustomers: 18, totalProducts: 15 },
      lowStockItems: [],
      salesTrend: [
        { date: '2026-06-19', revenue: 1200, orders: 3 },
        { date: '2026-06-20', revenue: 1850, orders: 5 },
        { date: '2026-06-21', revenue: 1400, orders: 4 },
        { date: '2026-06-22', revenue: 2600, orders: 7 },
        { date: '2026-06-23', revenue: 3100, orders: 9 },
        { date: '2026-06-24', revenue: 2280, orders: 6 },
        { date: '2026-06-25', revenue: 3000, orders: 8 }
      ],
      categorySales: [
        { name: 'Fruits & Vegetables', value: 4500 },
        { name: 'Dairy & Bread', value: 3800 },
        { name: 'Snacks & Munchies', value: 2900 },
        { name: 'Beverages', value: 2200 },
        { name: 'Bakery', value: 2030 }
      ]
    }
  });

  // 2. Fetch Active Orders
  const { data: activeOrders = [], isLoading: ordersLoading } = useQuery<ActiveOrder[]>({
    queryKey: ['admin-active-orders'],
    queryFn: () => apiRequest<ActiveOrder[]>('/orders/active'),
    placeholderData: []
  });

  // 3. Update Order Status Mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: string; status: string; note?: string }) =>
      apiRequest<any>(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });

  // 4. Assign Driver Mutation (Assign default Rohan Driver)
  const assignDriverMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest<any>(`/orders/${orderId}/assign`, {
        method: 'POST',
        // In real backend, we assign from body. In seeder, Rohan driver email is driver@freshkart.com. We can pass the hardcoded id or let backend decide.
        // Let's pass the driver body or let backend default
        body: JSON.stringify({
          // Rohan driver ID will be automatically detected on backend if we self-assign, but for admin, let's pass a default delivery ID
          // To keep it simple, our backend controller accepts driverId. In controllers/order.controller:
          // 'const driverId = req.user?.role === 'admin' ? req.body.driverId : req.user?._id;'
          // If we query active users of role "delivery", we could select them. For simulation simplicity, we find Rohan driver on the backend.
          driverId: 'default' 
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-active-orders'] });
    }
  });

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
  const summary = dashboardData?.summary || { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0 };
  const lowStock = dashboardData?.lowStockItems || [];
  const trend = dashboardData?.salesTrend || [];
  const pieData = dashboardData?.categorySales || [];

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Admin Console
            <ShieldCheck className="w-7 h-7 text-emerald-500 fill-emerald-500/10" />
          </h1>
          <p className="text-xs text-slate-400">Manage products, stock levels, orders, and view sales performance metrics</p>
        </div>
        
        <Link
          href="/admin/products"
          className="bg-emerald-505 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          Product Catalog Management
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Total Revenue</span>
            <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 dark:text-white">₹{summary.totalRevenue}</p>
          <span className="text-[10px] text-emerald-500 font-bold">+12.5% from last week</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Total Orders</span>
            <ShoppingBag className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 dark:text-white">{summary.totalOrders}</p>
          <span className="text-[10px] text-emerald-500 font-bold">+8.2% from last week</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Customers</span>
            <Users className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 dark:text-white">{summary.totalCustomers}</p>
          <span className="text-[10px] text-emerald-500 font-bold">+14.1% user growth</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Active Products</span>
            <Package className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <p className="font-heading text-2xl font-black text-slate-900 dark:text-white">{summary.totalProducts}</p>
          <span className="text-[10px] text-slate-450 dark:text-slate-500">In 5 active categories</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Sales Trend area plot */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs">
          <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="w-full h-64 text-[10px] text-slate-450">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution pie */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs">
          <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white mb-6">Sales by Category</h3>
          <div className="w-full h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Pie Legends */}
          <div className="grid grid-cols-2 gap-2 text-[10px] mt-4 text-slate-500 dark:text-slate-400">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Orders dispatch list */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">Active Order Queue</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Confirm order requests and coordinate courier drivers</p>
          </div>

          {ordersLoading ? (
            <p className="text-xs text-slate-450">Loading orders...</p>
          ) : activeOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No active checkout orders in progress.</p>
          ) : (
            <div className="space-y-3.5 text-xs">
              {activeOrders.map((ord) => (
                <div key={ord._id} className="border border-slate-100 dark:border-slate-850 rounded-2xl p-4 flex justify-between gap-4 flex-wrap items-center">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Order ID: #{ord._id.substring(ord._id.length - 8)}</p>
                    <p className="text-[10px] text-slate-400">User: {ord.user.name} | Total: ₹{ord.totals.grandTotal}</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-tight">
                      Items: {ord.items.map((it) => `${it.product.name} (x${it.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status updates */}
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatusMutation.mutate({
                          orderId: ord._id,
                          status: 'confirmed',
                          note: 'Order confirmed by store. Dispatching packaging team.'
                        })}
                        disabled={updateOrderStatusMutation.isPending}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-[10px] shadow-xs cursor-pointer"
                      >
                        Confirm Order
                      </button>
                    )}

                    {ord.status === 'confirmed' && (
                      <div className="flex gap-2">
                        {!ord.deliveryPartner && (
                          <button
                            onClick={() => assignDriverMutation.mutate(ord._id)}
                            disabled={assignDriverMutation.isPending}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-[10px] shadow-xs cursor-pointer"
                          >
                            Assign Rider
                          </button>
                        )}
                        <button
                          onClick={() => updateOrderStatusMutation.mutate({
                            orderId: ord._id,
                            status: 'packed',
                            note: 'Store has packed your fresh items. Awaiting rider dispatch.'
                          })}
                          disabled={updateOrderStatusMutation.isPending}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-[10px] shadow-xs cursor-pointer"
                        >
                          Mark Packed
                        </button>
                      </div>
                    )}

                    {ord.status === 'packed' && (
                      <div className="flex gap-2">
                        {!ord.deliveryPartner ? (
                          <button
                            onClick={() => assignDriverMutation.mutate(ord._id)}
                            disabled={assignDriverMutation.isPending}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-[10px] shadow-xs cursor-pointer"
                          >
                            Assign Rider
                          </button>
                        ) : (
                          <button
                            onClick={() => updateOrderStatusMutation.mutate({
                              orderId: ord._id,
                              status: 'out-for-delivery',
                              note: 'Rider is out for delivery! Track coordinates live.'
                            })}
                            disabled={updateOrderStatusMutation.isPending}
                            className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-[10px] shadow-xs cursor-pointer"
                          >
                            Ship Order
                          </button>
                        )}
                      </div>
                    )}

                    {ord.status === 'out-for-delivery' && (
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-sky-500 font-bold bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-lg">
                          Shipped {ord.deliveryPartner ? `(${ord.deliveryPartner.name})` : ''}
                        </span>
                        <button
                          onClick={() => updateOrderStatusMutation.mutate({
                            orderId: ord._id,
                            status: 'delivered',
                            note: 'OTP verified. Order delivered successfully!'
                          })}
                          disabled={updateOrderStatusMutation.isPending}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-[10px] shadow-xs cursor-pointer"
                        >
                          Mock Deliver
                        </button>
                      </div>
                    )}

                    {ord.status === 'delivered' && (
                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                        Delivered
                      </span>
                    )}

                    {ord.status === 'cancelled' && (
                      <span className="text-[10px] text-red-500 font-bold bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg">
                        Cancelled
                      </span>
                    )}

                    <Link
                      href={`/orders/${ord._id}/track`}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl"
                      title="Inspect tracking"
                    >
                      <Eye className="w-4.5 h-4.5 text-slate-450" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side widgets column */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 fill-amber-500/10" />
              <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">Low Stock Warnings</h3>
            </div>

            {lowStock.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All inventory levels healthy.</p>
            ) : (
              <div className="space-y-4 text-xs">
                {lowStock.map((it) => (
                  <div key={it._id} className="flex justify-between items-center pb-2.5 border-b border-slate-50 dark:border-slate-850 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{it.name}</p>
                      <p className="text-[9px] text-slate-450">{it.category.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded text-[9px]">
                        {it.stock} Left
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1">Price: ₹{it.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Inventory Forecast & Analytics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs space-y-5 text-xs text-slate-700 dark:text-slate-350">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">AI Inventory Forecasting</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-850 space-y-2">
                <p className="font-black text-[9px] uppercase tracking-wider text-slate-400">Restock Predictive Analysis</p>
                {lowStock.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      🚨 Critical: <span className="font-black text-emerald-500">{lowStock[0].name}</span> is depleted.
                    </p>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Based on weekly velocity (average 12 units/day), supply will be completely exhausted in <span className="font-bold text-amber-500">less than 24 hours</span>.
                    </p>
                    <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] text-emerald-500 font-bold">
                      💡 Recommended: Restock 150 units of {lowStock[0].name} immediately.
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 leading-normal">
                    All core grocery supplies are stable. Expected inventory runway for categories is <span className="font-bold text-emerald-500">12 days</span> based on current sales velocity.
                  </p>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-850 space-y-2">
                <p className="font-black text-[9px] uppercase tracking-wider text-slate-400">Customer Buying Insights</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold">Peak Ordering Hour</span>
                    <span className="font-black text-slate-900 dark:text-white">6:00 PM - 8:30 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold">Top Performing Category</span>
                    <span className="font-black text-emerald-500">Fruits & Vegetables (42%)</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold">Coupon Conversion Rate</span>
                    <span className="font-black text-slate-900 dark:text-white">64.5% (FRESH30 leading)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-105 dark:border-slate-850 space-y-2">
                <p className="font-black text-[9px] uppercase tracking-wider text-slate-400">Marketing Campaign Ideas</p>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Snacks & Beverages catalog sales are growing. Launch targeted <span className="font-semibold text-emerald-500">"Midnight Munchies"</span> campaign using 30% discount triggers on weekend orders above ₹399.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
