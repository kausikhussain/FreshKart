'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, ChevronRight, Star, Plus, Minus, Send, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { apiRequest } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

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
  reviewCount: number;
}

interface Review {
  _id: string;
  user: {
    name: string;
    profileImage?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  
  const { isAuthenticated } = useAuthStore();
  const { items, addToCart, updateQuantity } = useCartStore();

  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  // 1. Fetch Product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: () => apiRequest<Product>(`/products/${slug}`),
    retry: false
  });

  // 2. Fetch Reviews
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['product-reviews', product?._id],
    queryFn: () => apiRequest<Review[]>(`/products/${product?._id}/reviews`),
    enabled: !!product?._id
  });

  // 3. Fetch Related/Recommendations
  const { data: recommendations = [] } = useQuery<Product[]>({
    queryKey: ['recommendations', product?._id],
    queryFn: () => apiRequest<Product[]>(`/products/recommendations`, { params: { productId: product?._id } }),
    enabled: !!product?._id,
    placeholderData: []
  });

  // 4. Mutation to submit review
  const reviewMutation = useMutation({
    mutationFn: (newReview: { rating: number; comment: string }) =>
      apiRequest<Review>(`/products/${product?._id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(newReview)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product?._id] });
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    }
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    reviewMutation.mutate({ rating: reviewRating, comment: reviewComment });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-3xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-slate-100 dark:bg-slate-900 rounded w-2/3"></div>
              <div className="h-6 bg-slate-100 dark:bg-slate-900 rounded w-1/3"></div>
              <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="font-heading text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Product Not Found</h2>
          <p className="text-slate-400 text-xs mb-6">The grocery product you are looking for does not exist or has been removed.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-500 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs"
          >
            Go Back Home
          </button>
        </div>
      </Layout>
    );
  }

  const cartItem = items.find((item) => item.product._id === product._id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;
  const activePrice = product.discountPrice || product.price;
  const discountPercent = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  const handleAdd = () => {
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  };

  const handleIncrement = () => {
    if (currentQuantity < product.stock) {
      updateQuantity(product._id, currentQuantity + 1);
    }
  };

  const handleDecrement = () => {
    updateQuantity(product._id, currentQuantity - 1);
  };

  return (
    <Layout>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
        <span className="hover:text-emerald-500 cursor-pointer" onClick={() => router.push('/')}>Home</span>
        <ChevronRight className="w-3 h-3" />
        <span className="hover:text-emerald-500 cursor-pointer">Products</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{product.name}</span>
      </div>

      {/* Main product card detail */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] p-6 md:p-10 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        
        {/* Gallery */}
        <div className="aspect-square bg-slate-50 dark:bg-slate-950 rounded-3xl overflow-hidden flex items-center justify-center p-6 border border-slate-100 dark:border-slate-800/50">
          <img src={product.images[0]} alt={product.name} className="max-h-full object-contain rounded-2xl" />
        </div>

        {/* Details Panel */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-emerald-500/10 text-emerald-500 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                {product.unit}
              </span>
              {discountPercent > 0 && (
                <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'fill-amber-400' : 'text-slate-200 dark:text-slate-800'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.rating}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-xs text-slate-400">{product.reviewCount} Reviews</span>
            </div>

            {/* Price list */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                ₹{activePrice}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-slate-400 dark:text-slate-500 line-through">
                  ₹{product.price}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {product.description}
              </p>
            </div>
          </div>

          {/* Cart triggers */}
          <div>
            {product.stock === 0 ? (
              <div className="bg-red-500/10 text-red-500 border border-red-500/20 text-center font-bold px-6 py-4 rounded-2xl text-sm">
                This item is currently out of stock. Check back in a few hours!
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {currentQuantity > 0 ? (
                  <div className="bg-emerald-500 text-slate-950 rounded-2xl flex items-center shadow-lg overflow-hidden h-12">
                    <button
                      onClick={handleDecrement}
                      className="hover:bg-emerald-600 px-4 h-full transition-colors flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-bold text-sm min-w-[40px] text-center">
                      {currentQuantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      disabled={currentQuantity >= product.stock}
                      className="hover:bg-emerald-600 px-4 h-full transition-colors disabled:opacity-50 flex items-center justify-center"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAdd}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    Add to Basket
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                )}
                <span className="text-xs text-slate-400 font-medium">
                  {product.stock > 10 ? 'Available in stock' : `Only ${product.stock} items left!`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews & Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        {/* List of Reviews */}
        <div className="lg:col-span-2">
          <h2 className="font-heading text-xl font-bold text-slate-950 dark:text-white mb-6">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-8 text-center text-xs text-slate-400">
              No reviews for this product yet. Be the first one to write a review!
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center font-bold text-xs uppercase text-slate-700 dark:text-slate-350">
                        {rev.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{rev.user.name}</p>
                        <p className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {/* Stars */}
                    <div className="flex items-center text-amber-400 gap-0.5 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{rev.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-1">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Review */}
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-6">Write a Review</h2>
          {isAuthenticated ? (
            <form onSubmit={handleSubmitReview} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
              {reviewSuccess && (
                <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4" />
                  Review submitted successfully!
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Rating</label>
                <div className="flex items-center gap-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-200 dark:text-slate-800'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Your Feedback</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this product's freshness, packing, or delivery speed..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl p-3 h-24 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-150 leading-relaxed resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={reviewMutation.isPending}
                className="w-full bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 hover:opacity-95 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                Submit Review
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-3xl text-center text-xs">
              <p className="text-slate-450 dark:text-slate-400 mb-3 leading-relaxed">You must be logged in to review products.</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold px-4 py-1.5 rounded-xl transition-all"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recommended products grid */}
      {recommendations.length > 0 && (
        <section className="mb-6">
          <h2 className="font-heading text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-6">
            Recommended For You
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recommendations.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
