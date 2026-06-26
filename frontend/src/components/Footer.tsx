import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Superfast Delivery</h4>
            <p className="text-xs text-slate-400">Get your groceries at your doorstep in under 15 minutes.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Best Quality Guarantee</h4>
            <p className="text-xs text-slate-400">We source directly from farms to ensure peak freshness.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Easy Returns & Refunds</h4>
            <p className="text-xs text-slate-400">No questions asked return policy if you are unsatisfied.</p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-white">
              Fresh<span className="text-emerald-400">Kart</span>
            </span>
          </Link>
          <p className="text-xs leading-relaxed mb-4 text-slate-400">
            FreshKart is India&apos;s fastest-growing grocery delivery platform. Bringing the supermarket experience directly to your home with lightning speeds.
          </p>
        </div>

        <div>
          <h5 className="text-white font-bold text-sm mb-4">Useful Links</h5>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
            <li><Link href="/search" className="hover:text-emerald-400 transition-colors">Smart Search</Link></li>
            <li><Link href="/cart" className="hover:text-emerald-400 transition-colors">Cart Details</Link></li>
            <li><Link href="/admin/dashboard" className="hover:text-emerald-400 transition-colors">Admin Dashboard</Link></li>
            <li><Link href="/delivery/dashboard" className="hover:text-emerald-400 transition-colors">Delivery Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-white font-bold text-sm mb-4">Categories</h5>
          <ul className="space-y-2 text-xs">
            <li><Link href="/categories/fruits-vegetables" className="hover:text-emerald-400 transition-colors">Fruits & Vegetables</Link></li>
            <li><Link href="/categories/dairy-bread" className="hover:text-emerald-400 transition-colors">Dairy & Bread</Link></li>
            <li><Link href="/categories/snacks-munchies" className="hover:text-emerald-400 transition-colors">Snacks & Munchies</Link></li>
            <li><Link href="/categories/bakery" className="hover:text-emerald-400 transition-colors">Fresh Bakery</Link></li>
            <li><Link href="/categories/beverages" className="hover:text-emerald-400 transition-colors">Soft Beverages</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-white font-bold text-sm mb-4">Contact Info</h5>
          <p className="text-xs leading-loose text-slate-400">
            FreshKart Tech Headquarter<br />
            Outer Ring Road, Bellandur<br />
            Bengaluru, Karnataka - 560103<br />
            <span className="text-white">Email:</span> support@freshkart.com
          </p>
        </div>
      </div>

      <div className="bg-slate-950/60 py-6 border-t border-slate-800/40 text-center text-xs">
        <p>© {new Date().getFullYear()} FreshKart Technologies Pvt. Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
}
