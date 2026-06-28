'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import io from 'socket.io-client';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import HelpChatbot from './HelpChatbot';
import NotificationToast, { triggerNotification } from './NotificationToast';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/lib/api';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { items, getTotals } = useCartStore();
  const { user } = useAuthStore();
  const [cartOpen, setCartOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const { grandTotal } = getTotals();

  const isCartOrCheckout = pathname === '/cart' || pathname === '/checkout' || pathname?.includes('/track');
  const showFloatingCart = totalItems > 0 && !isCartOrCheckout;

  // Fetch active/pending orders to register socket notification rooms
  const { data: myOrders = [], refetch: refetchOrders } = useQuery<any[]>({
    queryKey: ['my-orders-notifications'],
    queryFn: () => apiRequest<any[]>('/orders/my'),
    enabled: !!user,
    refetchInterval: 15000 // keep synced periodically
  });

  // Setup global websocket listener for order status changes and driver dispatches
  useEffect(() => {
    if (!user || myOrders.length === 0) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socketInstance = io(socketUrl);

    socketInstance.on('connect', () => {
      console.log('Global notification socket connected');
      // Join room for each active order
      myOrders.forEach((order) => {
        if (order.status !== 'delivered' && order.status !== 'cancelled') {
          socketInstance.emit('joinOrder', order._id);
          console.log(`Joined global notification room for order ${order._id}`);
        }
      });
    });

    // Listen for status changes
    socketInstance.on('orderStatusChanged', (data: { orderId: string; status: string }) => {
      console.log('Received order status change in layout:', data);
      
      let note = `Order status updated to ${data.status}`;
      if (data.status === 'confirmed') note = 'Your order has been accepted by the store!';
      if (data.status === 'packed') note = 'Store partner has packed your order. Awaiting rider pickup.';
      if (data.status === 'out-for-delivery') note = 'Rider is out for delivery! Track your order live on the map.';
      if (data.status === 'delivered') note = 'Your fresh groceries have been delivered! Thank you for choosing FreshKart.';

      triggerNotification({
        title: `Order Update: ${data.status.replace('-', ' ').toUpperCase()}`,
        message: note,
        type: data.status === 'delivered' ? 'success' : data.status === 'out-for-delivery' ? 'delivery' : 'warning'
      });
      
      refetchOrders();
    });

    // Listen for driver assignments
    socketInstance.on('driverAssigned', (data: { orderId: string; driver: any }) => {
      triggerNotification({
        title: 'Driver Dispatched!',
        message: `Rider ${data.driver.name} is on the way to collect your groceries.`,
        type: 'delivery'
      });
      refetchOrders();
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user, myOrders.length]); // Rejoin if user or active order count changes

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      
      {/* Premium background decorative shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-emerald-400/5 dark:bg-emerald-500/5 blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[45%] aspect-square rounded-full bg-amber-400/5 dark:bg-amber-500/3 blur-[120px] pointer-events-none -z-10"></div>

      {/* Navigation */}
      <Navbar />

      {/* Main content body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Sticky Cart Bar for Mobile */}
      {showFloatingCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 sm:hidden">
          <div
            onClick={() => setCartOpen(true)}
            className="w-full bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 px-5 py-4 rounded-2xl flex items-center justify-between shadow-xl cursor-pointer pulse-primary-glow"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white/20 dark:bg-slate-950/20 px-2 py-1 rounded-lg font-bold text-[10px]">
                {totalItems} Items
              </div>
              <span className="font-bold text-sm">₹{grandTotal}</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-sm">
              <span>View Basket</span>
              <ArrowRight className="w-4 h-4 animate-float horizontal" style={{ animationName: 'none' }} />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar drawer reference */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Floating AI Help Chatbot */}
      <HelpChatbot />

      {/* Global Notifications System */}
      <NotificationToast />
    </div>
  );
}
