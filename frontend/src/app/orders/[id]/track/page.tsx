'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import io from 'socket.io-client';
import { MapPin, ShieldCheck, Zap, Bike, Phone, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { apiRequest } from '@/lib/api';

interface TrackingUpdate {
  status: string;
  timestamp: string;
  note?: string;
}

interface Order {
  _id: string;
  status: string;
  otpForDelivery: string;
  deliverySlot: string;
  totals: { grandTotal: number };
  deliveryAddress: { label: string; street: string };
  trackingUpdates: TrackingUpdate[];
  deliveryPartner?: { name: string; phone: string; profileImage?: string };
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [socket, setSocket] = useState<any>(null);
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [milestones, setMilestones] = useState<string[]>(['pending', 'confirmed', 'packed', 'out-for-delivery', 'delivered']);
  
  // 1. Fetch Order Details on Mount
  const { data: order, isLoading, refetch } = useQuery<Order>({
    queryKey: ['order-track', orderId],
    queryFn: () => apiRequest<Order>(`/orders/${orderId}`),
    refetchInterval: 10000 // refetch every 10s as safety fallback
  });

  // 2. Setup Socket.io Connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socketInstance = io(socketUrl);

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      socketInstance.emit('joinOrder', orderId);
    });

    // Listen for live driver location coordinates
    socketInstance.on('locationUpdated', (data: { lat: number; lng: number }) => {
      console.log('Received location updated:', data);
      setDriverLoc({ lat: data.lat, lng: data.lng });
    });

    // Listen for order status changes
    socketInstance.on('orderStatusChanged', (data: { orderId: string; status: string }) => {
      console.log('Received order status change:', data);
      refetch();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [orderId, refetch]);

  // Trigger simulated delivery trip on backend socket
  const triggerDeliverySimulation = () => {
    if (!socket) return;
    
    // Coordinates from Koramangala Warehouse (start) to Customer Home (end)
    const warehouse = { lat: 12.9300, lng: 77.6200 };
    const customer = { lat: 12.9352, lng: 77.6245 }; // Matches seeder default address

    // Transition state to out-for-delivery first
    apiRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'out-for-delivery',
        note: 'Simulated driver is out for delivery. Tracking active.'
      })
    }).then(() => {
      refetch();
      socket.emit('startDriverSimulation', {
        orderId,
        startLat: warehouse.lat,
        startLng: warehouse.lng,
        endLat: customer.lat,
        endLng: customer.lng
      });
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8 py-8 max-w-3xl mx-auto">
          <div className="h-8 bg-slate-100 dark:bg-slate-900 rounded w-1/3"></div>
          <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-3xl"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="font-heading text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Order Not Found</h2>
          <button onClick={() => router.push('/')} className="bg-emerald-500 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs">
            Return Home
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate coordinates mapping for SVG Map
  // Warehouse = (12.9300, 77.6200), Customer = (12.9352, 77.6245)
  // Let's normalize these values to SVG coordinate grid (width: 400, height: 250)
  const normLat = (lat: number) => 250 - ((lat - 12.928) / 0.01) * 250;
  const normLng = (lng: number) => ((lng - 77.618) / 0.01) * 400;

  const wX = normLng(12.9300); // Warehouse lat? No, swap for norm: normLng expects lng
  // Let's pass coordinates properly
  const wCoords = { x: normLng(77.6200), y: normLat(12.9300) };
  const cCoords = { x: normLng(77.6245), y: normLat(12.9352) };

  // Current Driver coordinate mapping
  let driverX = wCoords.x;
  let driverY = wCoords.y;
  if (driverLoc) {
    driverX = normLng(driverLoc.lng);
    driverY = normLat(driverLoc.lat);
  } else if (order.status === 'delivered') {
    driverX = cCoords.x;
    driverY = cCoords.y;
  }

  const currentStatusIdx = milestones.indexOf(order.status);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-slate-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order History
        </button>

        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-black text-slate-900 dark:text-white">Track Order</h1>
            <p className="text-xs text-slate-400">Order ID: {order._id}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-350 px-3.5 py-1.5 rounded-full flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Slot: {order.deliverySlot}
            </span>
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Real-time interactive SVG Vector Map */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-[2.5rem] p-6 mb-8 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-emerald-500/10 text-emerald-500 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Vector Map
            </span>
          </div>

          {/* SVG Map Canvas */}
          <svg viewBox="0 0 400 250" className="w-full h-auto bg-slate-100/50 dark:bg-slate-900/60 rounded-3xl border border-slate-200/50 dark:border-slate-800/40">
            {/* Street Grid lines */}
            <path d="M 0,50 L 400,50 M 0,130 L 400,130 M 0,200 L 400,200 M 80,0 L 80,250 M 200,0 L 200,250 M 320,0 L 320,250" stroke="rgba(0,0,0,0.04)" strokeWidth="3" className="dark:stroke-white/5" />
            <path d="M 0,90 L 400,160 M 120,0 L 220,250" stroke="rgba(0,0,0,0.03)" strokeWidth="2" className="dark:stroke-white/3" />
            
            {/* Route Line from Warehouse to Client */}
            <line
              x1={wCoords.x}
              y1={wCoords.y}
              x2={cCoords.x}
              y2={cCoords.y}
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeDasharray="6,4"
              className="animate-route"
            />
            
            {/* SVG Gradients definitions */}
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Warehouse Marker */}
            <circle cx={wCoords.x} cy={wCoords.y} r="8" fill="#10b981" />
            <circle cx={wCoords.x} cy={wCoords.y} r="14" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.3" className="animate-ping" style={{ transformOrigin: `${wCoords.x}px ${wCoords.y}px` }} />
            <text x={wCoords.x - 25} y={wCoords.y - 12} fill="#94a3b8" fontSize="8" fontWeight="bold">Warehouse</text>

            {/* Customer Home Marker */}
            <circle cx={cCoords.x} cy={cCoords.y} r="8" fill="#f59e0b" />
            <text x={cCoords.x - 20} y={cCoords.y - 12} fill="#94a3b8" fontSize="8" fontWeight="bold">My Flat</text>

            {/* Live Driver Pin */}
            <g transform={`translate(${driverX - 12}, ${driverY - 24})`}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3b82f6" />
              <circle cx="12" cy="9" r="3.5" fill="white" />
            </g>
          </svg>

          {/* Map Controls */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="absolute bottom-10">
              <button
                onClick={triggerDeliverySimulation}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse"
              >
                <Bike className="w-4 h-4 fill-current" />
                Simulate Delivery Ride
              </button>
            </div>
          )}
        </div>

        {/* Milestone and driver details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Status Milestones (Left/Mid) */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-xs space-y-6">
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Delivery Milestones</h2>
            
            <div className="relative border-l-2 border-slate-100 dark:border-slate-850 ml-3.5 pl-6 space-y-6 text-xs">
              {milestones.map((status, index) => {
                const isActive = index <= currentStatusIdx;
                const isCurrent = index === currentStatusIdx;
                
                const update = order.trackingUpdates.find((u) => u.status === status);

                return (
                  <div key={status} className="relative">
                    {/* Ring Badge */}
                    <div
                      className={`absolute left-[-33px] top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950 scale-110'
                          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                      }`}
                    >
                      {isActive && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                    </div>
                    
                    <div>
                      <p className={`font-bold capitalize ${isActive ? 'text-slate-850 dark:text-white' : 'text-slate-400'}`}>
                        {status.replace('-', ' ')}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {update?.note || `Awaiting milestone completion...`}
                      </p>
                      {update && (
                        <p className="text-[9px] text-slate-500 mt-1">
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Driver & OTP verification Card (Right) */}
          <div className="space-y-6">
            {/* OTP panel */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] border border-slate-800 p-6 shadow-xl text-center space-y-4">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
              <div>
                <h3 className="font-heading text-sm font-bold text-white">Delivery OTP Code</h3>
                <p className="text-[10px] text-slate-450 leading-relaxed mt-1">Share this 4-digit code with the delivery partner upon arrival to complete verification.</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 tracking-[0.4em] font-mono text-xl font-bold py-3.5 rounded-2xl max-w-[150px] mx-auto text-emerald-400 shadow-inner">
                {order.otpForDelivery}
              </div>
            </div>

            {/* Driver Profile */}
            {order.deliveryPartner ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 rounded-[2.5rem] p-5 shadow-xs flex items-center gap-4 text-xs">
                <div className="w-12 h-12 bg-emerald-500 text-slate-950 font-bold rounded-full flex items-center justify-center text-lg">
                  {order.deliveryPartner.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-850 dark:text-slate-100">{order.deliveryPartner.name}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-emerald-500" />
                    {order.deliveryPartner.phone}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-105 rounded-[2.5rem] p-5 text-center text-xs text-slate-400">
                <Bike className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>Waiting to assign a delivery partner near you...</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
