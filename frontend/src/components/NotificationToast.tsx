'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Package, Truck, Info, X } from 'lucide-react';

export interface INotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'delivery';
  timestamp: Date;
}

// Global helper to trigger notifications from anywhere on the client
export const triggerNotification = (notification: {
  title: string;
  message: string;
  type: INotification['type'];
}) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('fk-push-notification', { detail: notification });
    window.dispatchEvent(event);
  }
};

export default function NotificationToast() {
  const [toasts, setToasts] = useState<INotification[]>([]);

  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const newToast: INotification = {
        id: Math.random().toString(36).substring(2, 9),
        title: detail.title,
        message: detail.message,
        type: detail.type || 'info',
        timestamp: new Date(),
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 3)); // Max 3 visible at once

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    };

    window.addEventListener('fk-push-notification', handleNewNotification);
    return () => {
      window.removeEventListener('fk-push-notification', handleNewNotification);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: INotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'delivery':
        return <Truck className="w-5 h-5 text-sky-500" />;
      case 'warning':
        return <Package className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed top-6 right-6 z-55 w-80 sm:w-96 flex flex-col gap-3 pointer-events-none font-sans text-xs">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex gap-3.5 items-start relative overflow-hidden pulse-primary-glow"
          >
            {/* Colored side indicator */}
            <div
              className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                toast.type === 'success'
                  ? 'bg-emerald-500'
                  : toast.type === 'delivery'
                  ? 'bg-sky-500'
                  : toast.type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
            />

            {/* Notification Icon */}
            <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>

            {/* Content Details */}
            <div className="flex-1 space-y-1 pr-4">
              <h4 className="font-heading font-black text-slate-850 dark:text-white leading-tight">
                {toast.title}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 leading-normal text-[10px]">
                {toast.message}
              </p>
              <span className="text-[8px] text-slate-400 block mt-1">
                {toast.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
