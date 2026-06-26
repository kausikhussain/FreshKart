'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, ChevronRight, Zap, Award, ShieldCheck, Heart, Clock, Utensils, Sparkles, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { apiRequest } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';

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

const RECIPES = [
  {
    id: 'recipe-paneer',
    title: 'Malai Paneer Butter Masala',
    description: 'A rich, creamy, and restaurant-style curry made with fresh paneer cooked in a spiced tomato butter gravy.',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600',
    prepTime: '15m',
    difficulty: 'Easy',
    serves: '2-3',
    ingredientSlugs: ['fresh-malai-paneer', 'amul-salted-butter', 'fresh-tomato'],
    fallbackIngredients: [
      {
        _id: '106',
        name: 'Fresh Malai Paneer',
        slug: 'fresh-malai-paneer',
        price: 90,
        discountPrice: 82,
        unit: '200 g',
        images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400'],
        stock: 75
      },
      {
        _id: '105',
        name: 'Amul Salted Butter',
        slug: 'amul-salted-butter',
        price: 105,
        discountPrice: 102,
        unit: '100 g',
        images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400'],
        stock: 90
      },
      {
        _id: '103',
        name: 'Fresh Tomato (Hybrid)',
        slug: 'fresh-tomato',
        price: 35,
        discountPrice: 28,
        unit: '500 g',
        images: ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400'],
        stock: 150
      }
    ]
  },
  {
    id: 'recipe-breakfast',
    title: 'Classic Butter Toast & Milk',
    description: 'A quick, classic breakfast containing toasted whole wheat bread, premium salted butter, and fresh milk.',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600',
    prepTime: '5m',
    difficulty: 'Easy',
    serves: '1-2',
    ingredientSlugs: ['whole-wheat-bread', 'amul-salted-butter', 'fresh-toned-milk'],
    fallbackIngredients: [
      {
        _id: '201',
        name: 'Whole Wheat Bread',
        slug: 'whole-wheat-bread',
        price: 50,
        discountPrice: 45,
        unit: '400 g',
        images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400'],
        stock: 60
      },
      {
        _id: '105',
        name: 'Amul Salted Butter',
        slug: 'amul-salted-butter',
        price: 105,
        discountPrice: 102,
        unit: '100 g',
        images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400'],
        stock: 90
      },
      {
        _id: '102',
        name: 'Fresh Toned Milk',
        slug: 'fresh-toned-milk',
        price: 32,
        discountPrice: 30,
        unit: '500 ml',
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400'],
        stock: 200
      }
    ]
  },
  {
    id: 'recipe-fruits',
    title: 'Immunity Fruit Bowl & Juice',
    description: 'Rejuvenate your body with sweet imported Royal Gala apples, organic bananas, and pure orange juice.',
    image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&q=80&w=600',
    prepTime: '10m',
    difficulty: 'Easy',
    serves: '2',
    ingredientSlugs: ['royal-gala-apple', 'organic-banana', 'orange-fruit-juice'],
    fallbackIngredients: [
      {
        _id: '104',
        name: 'Royal Gala Apple',
        slug: 'royal-gala-apple',
        price: 180,
        discountPrice: 159,
        unit: '4 pcs',
        images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400'],
        stock: 50
      },
      {
        _id: '101',
        name: 'Organic Banana (Robusta)',
        slug: 'organic-banana',
        price: 60,
        discountPrice: 48,
        unit: '6 pcs',
        images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=400'],
        stock: 80
      },
      {
        _id: '202',
        name: '100% Orange Fruit Juice',
        slug: 'orange-fruit-juice',
        price: 120,
        discountPrice: 99,
        unit: '1 L',
        images: ['https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400'],
        stock: 100
      }
    ]
  }
];

export default function HomePage() {
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 45, seconds: 30 });
  const [activeSlide, setActiveSlide] = useState(0);
  const { addToCart } = useCartStore();
  const [addingRecipeId, setAddingRecipeId] = useState<string | null>(null);

  // Fetch all products to resolve ingredients with exact db details
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['all-products-for-recipes'],
    queryFn: async () => {
      try {
        const res = await apiRequest<{ products: Product[] }>('/products', { params: { limit: '100' } });
        return res.products || [];
      } catch (err) {
        console.error('Error fetching products for recipe kits:', err);
        return [];
      }
    }
  });

  const resolveProduct = (slug: string, fallback: any) => {
    const dbProd = allProducts.find((p: any) => p.slug === slug);
    return dbProd ? {
      _id: dbProd._id,
      name: dbProd.name,
      slug: dbProd.slug,
      price: dbProd.price,
      discountPrice: dbProd.discountPrice,
      unit: dbProd.unit,
      images: dbProd.images,
      stock: dbProd.stock
    } : fallback;
  };

  const getBundlePrice = (recipe: typeof RECIPES[0]) => {
    let total = 0;
    let discountTotal = 0;
    recipe.ingredientSlugs.forEach(slug => {
      const fallback = recipe.fallbackIngredients.find(x => x.slug === slug);
      const item = resolveProduct(slug, fallback);
      total += item.price;
      discountTotal += item.discountPrice || item.price;
    });
    return { total, discountTotal };
  };

  const handleAddRecipe = (recipe: typeof RECIPES[0]) => {
    setAddingRecipeId(recipe.id);
    recipe.ingredientSlugs.forEach(slug => {
      const fallback = recipe.fallbackIngredients.find(x => x.slug === slug);
      const product = resolveProduct(slug, fallback);
      addToCart(product, 1);
    });
    setTimeout(() => {
      setAddingRecipeId(null);
    }, 2000);
  };

  const slides = [
    {
      badge: "LIGHTNING SPEED DELIVERY IN 15 MINUTES",
      title: "Freshness Delivered in Minutes!",
      desc: "Say goodbye to waiting lists and long lines. Get fresh organic farm vegetables, tomatoes, and dairy supplies delivered instantly.",
      bg: "from-emerald-500/95 to-teal-650/95 dark:from-emerald-950/85 dark:to-slate-900",
      btnText: "Order Groceries Now",
      btnLink: "/search"
    },
    {
      badge: "CRAVINGS SORTED 24/7",
      title: "Midnight Munchies & Cravings!",
      desc: "Need late night chips, chocolates, carbonated drinks, or warm croissants? We deliver through the night at lightning speed.",
      bg: "from-purple-650/95 to-rose-650/95 dark:from-purple-950/85 dark:to-slate-900",
      btnText: "Explore Munchies",
      btnLink: "/categories/snacks-munchies"
    },
    {
      badge: "SUPER DISCOUNT OFFERS",
      title: "Unlock Extra Monsoon Savings!",
      desc: "Get flat 20% off on premium organic baking supplies, breads, and fresh butter. Code: WELCOME100 or FRESH30.",
      bg: "from-amber-500/95 to-orange-650/95 dark:from-amber-950/85 dark:to-slate-900",
      btnText: "View Coupons",
      btnLink: "/profile"
    }
  ];

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

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
      <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl mb-12 min-h-[340px] flex items-center bg-slate-900">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-gradient-to-br ${slide.bg} p-8 md:p-12 flex flex-col justify-center transition-all duration-700 ${idx === activeSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none -z-10'}`}
          >
            <div className="absolute right-[-10%] top-[-10%] w-[45%] aspect-square bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute left-[30%] bottom-[-20%] w-[35%] aspect-square bg-emerald-300/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-2xl relative z-10 text-white">
              <div className="inline-flex items-center gap-1.5 bg-white/20 dark:bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-5">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{slide.badge}</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4">
                {slide.title}
              </h1>
              
              <p className="text-xs sm:text-sm text-white/95 mb-8 max-w-lg leading-relaxed">
                {slide.desc}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={slide.btnLink}
                  className="bg-slate-950 hover:bg-slate-900 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-slate-950 px-6 py-3 rounded-2xl font-bold text-xs transition-all shadow-lg active:scale-95"
                >
                  {slide.btnText}
                </Link>
                <a
                  href="#categories"
                  className="bg-white/20 hover:bg-white/30 border border-white/25 px-6 py-3 rounded-2xl font-bold text-xs transition-all backdrop-blur-xs flex items-center gap-1 text-white"
                >
                  Browse Categories
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
        {/* Slide Indicator Dots */}
        <div className="absolute bottom-6 left-8 md:left-12 flex gap-2 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeSlide ? 'bg-white w-6' : 'bg-white/40'}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
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

      {/* Featured Brands Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Featured Brands
            </h2>
            <p className="text-xs text-slate-400">Order from your favorite household grocery brands</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {[
            { name: "Amul", logo: "🧈", desc: "Dairy Specialties", bg: "bg-emerald-500/10 text-emerald-500" },
            { name: "Coca-Cola", logo: "🥤", desc: "Refreshing Beverages", bg: "bg-red-500/10 text-red-500" },
            { name: "Lay's", logo: "🥔", desc: "Crispy Snacks", bg: "bg-amber-500/10 text-amber-500" },
            { name: "Cadbury", logo: "🍫", desc: "Sweet Chocolates", bg: "bg-purple-500/10 text-purple-500" },
            { name: "Haldiram's", logo: "🥨", desc: "Traditional Namkeen", bg: "bg-orange-500/10 text-orange-500" },
            { name: "Nestle", logo: "☕", desc: "Hot Drinks & Noodles", bg: "bg-blue-500/10 text-blue-500" },
            { name: "Mother Dairy", logo: "🥛", desc: "Fresh Milk & Curd", bg: "bg-sky-500/10 text-sky-505 text-sky-500" }
          ].map((brand, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-40 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800/80 rounded-[2rem] p-4 flex flex-col items-center justify-center hover:shadow-md transition-shadow duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${brand.bg} flex items-center justify-center text-2xl mb-3 shadow-xs`}>
                {brand.logo}
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{brand.name}</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">{brand.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Meal Kit Recipe Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Utensils className="w-6 h-6 text-emerald-500" />
              Cook Fresh Tonight — AI Meal Kits
            </h2>
            <p className="text-xs text-slate-400">One-click bundles with all the fresh ingredients you need</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RECIPES.map((recipe) => {
            const { total, discountTotal } = getBundlePrice(recipe);
            const isAdding = addingRecipeId === recipe.id;
            
            return (
              <div
                key={recipe.id}
                className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between h-full group"
              >
                {/* Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap">
                    <span className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md text-[10px] font-extrabold text-white px-2.5 py-1 rounded-full border border-white/10">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {recipe.prepTime}
                    </span>
                    <span className="flex items-center gap-1 bg-emerald-500/90 text-[10px] font-extrabold text-slate-950 px-2.5 py-1 rounded-full">
                      <Sparkles className="w-3 h-3 text-slate-950" />
                      {recipe.difficulty}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-heading text-base font-black text-white leading-snug drop-shadow-md">
                      {recipe.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {recipe.description}
                    </p>

                    <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                      <p className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <span>Required Ingredients</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      </p>
                      {recipe.ingredientSlugs.map((slug) => {
                        const fallback = recipe.fallbackIngredients.find((x) => x.slug === slug);
                        const item = resolveProduct(slug, fallback);
                        return (
                          <div key={slug} className="flex items-center justify-between text-xs py-0.5">
                            <div className="flex items-center gap-2">
                              <img
                                src={item.images[0]}
                                alt={item.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 animate-fade-in"
                              />
                              <span className="font-bold text-slate-700 dark:text-slate-350 line-clamp-1">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-extrabold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded-md">
                              {item.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer & CTA */}
                  <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-850">
                    <div className="flex items-center justify-between mb-3.5">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bundle price</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            ₹{discountTotal}
                          </span>
                          {total > discountTotal && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{total}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {total > discountTotal && (
                        <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30">
                          Save ₹{total - discountTotal}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddRecipe(recipe)}
                      disabled={isAdding}
                      className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] ${
                        isAdding
                          ? 'bg-slate-900 text-emerald-450 dark:bg-emerald-600 dark:text-slate-950 cursor-wait'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 cursor-pointer shadow-emerald-500/10 hover:shadow-emerald-500/20'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added to Basket! ✓</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Add All Ingredients</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
