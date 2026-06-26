'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, Sun, Moon, MapPin, User, LogOut, ShoppingCart, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, getTotals } = useCartStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const { grandTotal } = getTotals();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    // Determine active theme on load
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };

  const activeAddress = user?.addresses?.find(addr => addr.isDefault) || user?.addresses?.[0];

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-slate-200/50 dark:border-slate-800/40 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo Section */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl shadow-md transition-transform group-hover:scale-105">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Fresh<span className="text-emerald-500">Kart</span>
              </span>
            </Link>

            {/* Address Location Display */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] border-l border-slate-200 dark:border-slate-800 pl-4 py-1.5">
                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 animate-bounce" />
                <div className="truncate">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeAddress ? `Deliver to ${activeAddress.label}` : 'Select Address'}
                  </p>
                  <p className="truncate text-[10px]">
                    {activeAddress ? activeAddress.street : 'Add default address in profile'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Search trigger box */}
          <div className="flex-1 max-w-lg hidden sm:block relative">
            <Link href="/search" className="flex items-center gap-3 w-full bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-900 dark:hover:bg-slate-800/80 px-4 py-2 rounded-xl text-slate-400 dark:text-slate-500 text-sm transition-all border border-transparent dark:border-slate-800">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search &quot;milk&quot;, &quot;vegetables&quot; or &quot;chips&quot;...</span>
              <kbd className="absolute right-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] px-1.5 py-0.5 rounded-md text-slate-400 font-mono">/</kbd>
            </Link>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-4">
            {/* Search icon trigger for small screens */}
            <Link href="/search" className="sm:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors">
              <Search className="w-5 h-5" />
            </Link>

            {/* Light/Dark Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Profile Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors text-sm text-slate-700 dark:text-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-inner">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium hidden md:inline">{user?.name.split(' ')[0]}</span>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl py-2 shadow-xl border border-slate-100 dark:border-slate-800/80 z-20 text-slate-700 dark:text-slate-200">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                        <p className="text-slate-400 dark:text-slate-500">{user?.email}</p>
                      </div>
                      
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-sm transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 text-emerald-500" />
                        My Profile
                      </Link>

                      {user?.role === 'admin' && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-sm font-semibold text-amber-500 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                          Admin Console
                        </Link>
                      )}

                      {user?.role === 'delivery' && (
                        <Link
                          href="/delivery/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 text-sm font-semibold text-emerald-500 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <ShoppingCart className="w-4 h-4 text-emerald-500" />
                          Driver Panel
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          router.push('/');
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 text-sm transition-colors border-t border-slate-100 dark:border-slate-800 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
              >
                Sign In
              </Link>
            )}

            {/* Cart Widget */}
            <Link
              href="/cart"
              onClick={(e) => {
                e.preventDefault();
                setCartOpen(true);
              }}
              className="bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-95 shadow-md transition-all font-semibold text-xs active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <div className="text-left leading-tight hidden md:block">
                <p className="text-[10px] opacity-75">{totalItems} items</p>
                <p className="font-bold">₹{grandTotal}</p>
              </div>
              <span className="md:hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">
                {totalItems}
              </span>
            </Link>

          </div>
        </div>
      </div>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}
