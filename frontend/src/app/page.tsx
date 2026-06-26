'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, ChevronRight, Zap, Award, ShieldCheck, Heart } from 'lucide-react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { apiRequest } from '@/lib/api';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  unit: string;
  images: string[];
  stock: number;
  rating: number;
  isTrending?: boolean;
}

export default function HomePage() {
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 45, seconds: 30 });

  // 1. Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiRequest<Category[]>('/categories'),
    placeholderData: [
      { _id: '1', name: 'Fruits & Vegetables', slug: 'fruits-vegetables', image: 'https://images.unsplash.com/photo-1610348725531-843dff147e2c?auto=format&fit=crop&q=80&w=150' },
      { _id: '2', name: 'Dairy & Bread', slug: 'dairy-bread', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=150' },
      { _id: '3', name: 'Snacks & Munchies', slug: 'snacks-munchies', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?auto=format&fit=crop&q=80&w=150' },
      { _id: '4', name: 'Bakery', slug: 'bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=150' },
      { _id: '5', name: 'Beverages', slug: 'beverages', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=150' }
    ]
  });

  // 2. Fetch Trending Products
  const { data: trendingProducts = [] } = useQuery<Product[]>({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const res = await apiRequest<{ products: Product[] }>('/products', { params: { isTrending: 'true' } });
      return res.products;
    },
    placeholderData: [
      {
        _id: '101',
        name: 'Fresh Red Onion',
        slug: 'fresh-red-onion',
        description: 'Premium quality red onions.',
        price: 45,
        discountPrice: 38,
        unit: '1 kg',
        images: ['https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=400'],
        stock: 50,
        rating: 4.8
      },
      {
        _id: '102',
        name: 'Fresh Toned Milk',
        slug: 'fresh-toned-milk',
        description: 'Toned milk.',
        price: 32,
        discountPrice: 30,
        unit: '500 ml',
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400'],
        stock: 120,
        rating: 4.7
      },
      {
        _id: '103',
        name: 'Classic Salted Potato Chips',
        slug: 'classic-salted-chips',
        description: 'Crispy salted chips.',
        price: 20,
        unit: '50 g',
        images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400'],
        stock: 300,
        rating: 4.5
      },
      {
        _id: '104',
        name: 'Royal Gala Apple',
        slug: 'royal-gala-apple',
        description: 'Fresh gala apples.',
        price: 180,
        discountPrice: 159,
        unit: '4 pcs',
        images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400'],
        stock: 35,
        rating: 4.9
      }
    ]
  });

  // Countdown timer calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 59, seconds: 59 }; // reset
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout>
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500/90 to-teal-600/90 dark:from-emerald-950/80 dark:to-slate-900 text-slate-950 dark:text-white p-8 md:p-12 mb-12 shadow-2xl">
        <div className="absolute right-[-10%] top-[-10%] w-[45%] aspect-square bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-[30%] bottom-[-20%] w-[35%] aspect-square bg-emerald-300/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 dark:bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-950 dark:text-emerald-400 mb-6">
            <Zap className="w-4 h-4 fill-current" />
            <span>LIGHTNING SPEED DELIVERY IN 15 MINUTES</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4">
            Freshness <br className="sm:hidden" />
            <span className="text-white dark:text-emerald-400">Delivered</span> <br />
            in Minutes!
          </h1>
          
          <p className="text-sm md:text-base text-emerald-950/80 dark:text-slate-300 mb-8 max-w-lg">
            Say goodbye to waiting lists and long lines. Get vegetables, fresh farm milk, crunchiest chips, and daily household supplies delivered instantly.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/search"
              className="bg-slate-950 hover:bg-slate-900 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-slate-950 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Order Groceries Now
            </Link>
            <a
              href="#categories"
              className="bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 border border-white/25 px-6 py-3 rounded-2xl font-bold text-sm transition-all backdrop-blur-xs flex items-center gap-1"
            >
              Browse Categories
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Category Grid Section */}
      <section id="categories" className="mb-12 scroll-mt-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Shop by Category
            </h2>
            <p className="text-xs text-slate-400">Fresh and quick items grouped for easy discovery</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/categories/${cat.slug}`}
              className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-4 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-emerald-500/20 dark:hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center mb-3 overflow-hidden group-hover:scale-105 transition-transform">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-16 h-16 object-contain" />
                ) : (
                  <ShoppingBag className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Sale Deal Banner */}
      <section className="bg-slate-900 dark:bg-slate-900/60 rounded-[2rem] border border-slate-800 p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-[40%] bg-emerald-500/5 blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="bg-emerald-500 text-slate-950 p-4 rounded-3xl shadow-lg animate-bounce">
            <Zap className="w-8 h-8 fill-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                FLASH SALE
              </span>
              <span className="text-xs text-slate-400">Limited stocks available!</span>
            </div>
            <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-1">
              Flat 50% Off on Everyday Fruits & Veggies
            </h3>
            <p className="text-xs text-slate-400">Grab organic avocados, juicy mangoes, and farm spinach before they sell out.</p>
          </div>
        </div>

        {/* Countdown Box */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-5 py-3 rounded-2xl shadow-inner">
          <div className="text-center min-w-[32px]">
            <p className="text-sm font-black text-emerald-400 leading-tight">
              {String(countdown.hours).padStart(2, '0')}
            </p>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Hrs</p>
          </div>
          <span className="text-emerald-400 font-bold mb-3">:</span>
          <div className="text-center min-w-[32px]">
            <p className="text-sm font-black text-emerald-400 leading-tight">
              {String(countdown.minutes).padStart(2, '0')}
            </p>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Min</p>
          </div>
          <span className="text-emerald-400 font-bold mb-3">:</span>
          <div className="text-center min-w-[32px]">
            <p className="text-sm font-black text-emerald-400 leading-tight">
              {String(countdown.seconds).padStart(2, '0')}
            </p>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Sec</p>
          </div>
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Trending Products
            </h2>
            <p className="text-xs text-slate-400">Most ordered groceries in your area today</p>
          </div>
          <Link
            href="/categories/fruits-vegetables"
            className="text-xs font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-0.5"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {trendingProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* Quick features testimonials/banner */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs">
          <Award className="w-8 h-8 text-emerald-500 mb-4" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">High Quality Sourced</h4>
          <p className="text-xs text-slate-400 leading-relaxed">We maintain complete cold chains and quality audits from local farmer associations to keep vegetables crisp and dairy cold.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mb-4" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Zero Contact Deliveries</h4>
          <p className="text-xs text-slate-400 leading-relaxed">Our partners adhere to maximum hygiene. Request safe drop-offs outside your flat, apartment lobby, or society gate.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs">
          <Heart className="w-8 h-8 text-emerald-500 mb-4" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Customer First Support</h4>
          <p className="text-xs text-slate-400 leading-relaxed">Not happy with item freshness? Simply request an instant refund in your app dashboard. Refund process takes under 2 minutes.</p>
        </div>
      </section>
    </Layout>
  );
}
