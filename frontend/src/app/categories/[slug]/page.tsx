'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Filter, ArrowUpDown, ChevronRight, SlidersHorizontal } from 'lucide-react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { apiRequest } from '@/lib/api';

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
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [sort, setSort] = useState<string>('default');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  // 1. Fetch current category details to show title
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiRequest<Category[]>('/categories')
  });

  const currentCategoryName = categories.find((c) => c.slug === slug)?.name || 
    slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  // 2. Fetch products under this category
  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['products-category', slug, selectedSubcategory, sort, minPrice, maxPrice],
    queryFn: () =>
      apiRequest<{ products: Product[] }>('/products', {
        params: {
          category: slug,
          subcategory: selectedSubcategory || undefined,
          sort: sort !== 'default' ? sort : undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined
        }
      }),
    placeholderData: { products: [] }
  });

  const products = data?.products || [];

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
        <span className="hover:text-emerald-500 cursor-pointer" onClick={() => router.push('/')}>Home</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 dark:text-slate-300 font-medium capitalize">{slug.replace('-', ' ')}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 h-fit shadow-xs">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <SlidersHorizontal className="w-4.5 h-4.5 text-emerald-500" />
            <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white">Filters & Sorting</h3>
          </div>

          {/* Sort selection */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Sort By
            </label>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="default">Relevance (Default)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Price Range
            </label>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Min (₹)</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Max (₹)</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom quick filters */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Brand Type
            </label>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-emerald-500 rounded" />
                <span>Organic Organic</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-emerald-500 rounded" />
                <span>Premium Quality</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-emerald-500 rounded" />
                <span>Popular Brand</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Results */}
        <div className="flex-1">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-black text-slate-900 dark:text-white capitalize">
                {currentCategoryName}
              </h2>
              <p className="text-xs text-slate-400">{products.length} products found in this category</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-4 animate-pulse flex flex-col gap-4">
                  <div className="w-full aspect-square bg-slate-100 dark:bg-slate-950 rounded-2xl"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-950 rounded w-2/3"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-950 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <Filter className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-200 mb-1">No products match filters</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">Try resetting your price limits or browsing our primary categories on the home page.</p>
              <button
                onClick={() => {
                  setMinPrice(0);
                  setMaxPrice(1000);
                  setSort('default');
                }}
                className="bg-emerald-500 text-slate-950 text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
