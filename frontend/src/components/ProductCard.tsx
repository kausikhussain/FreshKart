'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Star, Zap } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export interface ProductCardProps {
  product: {
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
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addToCart, updateQuantity } = useCartStore();

  const cartItem = items.find((item) => item.product._id === product._id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const originalPrice = product.price;
  const activePrice = product.discountPrice || product.price;
  const discountPercent = product.discountPrice
    ? Math.round(((originalPrice - product.discountPrice) / originalPrice) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentQuantity < product.stock) {
      updateQuantity(product._id, currentQuantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product._id, currentQuantity - 1);
  };

  const isLowStock = product.stock > 0 && product.stock < 10;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-3 flex flex-col justify-between hover:shadow-xl hover:border-emerald-500/20 dark:hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1">
      
      {/* Product Image and badges */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-square w-full bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden mb-3">
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5 z-10 shadow-sm animate-pulse">
            <Zap className="w-3 h-3 fill-slate-950" />
            <span>{discountPercent}% OFF</span>
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 bg-slate-900/60 dark:bg-slate-950/70 text-amber-400 font-semibold text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 z-10 backdrop-blur-xs">
          <Star className="w-2.5 h-2.5 fill-amber-400" />
          <span>{product.rating}</span>
        </div>

        {/* Product Image */}
        <div className="w-full h-full relative transition-transform duration-500 group-hover:scale-105">
          <img
            src={product.images[0]}
            alt={product.name}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>

        {/* Out Of Stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
            Out of Stock
          </div>
        )}

        {/* Low Stock label */}
        {isLowStock && (
          <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-slate-950 text-center font-bold text-[9px] py-0.5">
            Only {product.stock} left in stock!
          </div>
        )}
      </Link>

      {/* Info and Purchase actions */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
          {product.unit}
        </span>
        
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-100 hover:text-emerald-500 transition-colors line-clamp-2 h-8 leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* Price and Add Button */}
        <div className="flex items-center justify-between mt-1 gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              ₹{activePrice}
            </span>
            {product.discountPrice && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through">
                ₹{product.price}
              </span>
            )}
          </div>

          {/* Smart Cart Toggle */}
          {isOutOfStock ? (
            <button
              disabled
              className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold px-4 py-1.5 rounded-xl cursor-not-allowed border border-slate-200 dark:border-transparent"
            >
              Unavailable
            </button>
          ) : currentQuantity > 0 ? (
            <div className="bg-emerald-500 text-slate-950 rounded-xl flex items-center shadow-md overflow-hidden">
              <button
                onClick={handleDecrement}
                className="hover:bg-emerald-600 p-1.5 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-bold min-w-[20px] text-center">
                {currentQuantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={currentQuantity >= product.stock}
                className="hover:bg-emerald-600 p-1.5 transition-colors disabled:opacity-50"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="bg-white hover:bg-emerald-50 text-emerald-600 dark:bg-slate-950 dark:hover:bg-emerald-950/20 text-xs font-bold px-4 py-1.5 rounded-xl transition-all border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs active:scale-95 flex items-center gap-1"
            >
              ADD
              <Plus className="w-3 h-3 text-emerald-500" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
