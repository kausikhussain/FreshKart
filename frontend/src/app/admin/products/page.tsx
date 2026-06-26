'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Edit2, Trash2, ShieldAlert, Sparkles, Check, X, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
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
  category: { _id: string; name: string };
  isTrending: boolean;
}

interface Category {
  _id: string;
  name: string;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [discountPrice, setDiscountPrice] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState('1 kg');
  const [stock, setStock] = useState<number>(100);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isTrending, setIsTrending] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // 1. Fetch categories for select dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiRequest<Category[]>('/categories')
  });

  // 2. Fetch all products (admin query includes draft / active)
  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['admin-products-list'],
    queryFn: () => apiRequest<{ products: Product[] }>('/products?limit=100'),
    placeholderData: { products: [] }
  });

  const products = productsData?.products || [];

  // 3. Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest<Product>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      resetForm();
    }
  });

  // 4. Update Product Mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      apiRequest<Product>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      resetForm();
    }
  });

  // 5. Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<any>(`/admin/products/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
    }
  });

  const handleEditClick = (prod: Product) => {
    setEditingProductId(prod._id);
    setName(prod.name);
    setPrice(prod.price);
    setDiscountPrice(prod.discountPrice);
    setUnit(prod.unit);
    setStock(prod.stock);
    setDescription(prod.description);
    setSelectedCategory(prod.category._id);
    setIsTrending(prod.isTrending);
    setImageUrl(prod.images[0] || '');
    setShowAddForm(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !unit || !selectedCategory) return;

    const payload = {
      name,
      description,
      price,
      discountPrice: discountPrice || undefined,
      unit,
      stock,
      category: selectedCategory,
      isTrending,
      images: imageUrl ? [imageUrl] : undefined
    };

    if (editingProductId) {
      updateProductMutation.mutate({ id: editingProductId, body: payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice(0);
    setDiscountPrice(undefined);
    setUnit('1 kg');
    setStock(100);
    setDescription('');
    setSelectedCategory('');
    setIsTrending(false);
    setImageUrl('');
    setEditingProductId(null);
    setShowAddForm(false);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        
        {/* Header navigation back */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-slate-600 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="font-heading text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Manage Products
              <ShieldAlert className="w-7 h-7 text-emerald-500 fill-emerald-500/10" />
            </h1>
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-505 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4.5 h-4.5" />
              Add New Product
            </button>
          )}
        </div>

        {/* Add/Edit Form panel overlay */}
        {showAddForm && (
          <form
            onSubmit={handleFormSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-xl text-xs space-y-4 mb-8"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-emerald-500" />
                {editingProductId ? 'Edit Product Parameters' : 'Add New Grocery Product'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl"
              >
                <X className="w-4.5 h-4.5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Organic Avocado"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Price (₹)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Discount Price (₹)</label>
                    <input
                      type="number"
                      value={discountPrice || ''}
                      onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Unit / Size</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. 500 g, 1 L, 1 pc"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Stock Inventory</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200"
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl h-24 text-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="Description, organic values, storage conditions details..."
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    checked={isTrending}
                    onChange={(e) => setIsTrending(e.target.checked)}
                    id="isTrending"
                    className="accent-emerald-500 rounded w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isTrending" className="font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                    Promote to Trending list
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="bg-emerald-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
              >
                {editingProductId ? 'Save Changes' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-450 px-6 py-2.5 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Product List Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.5rem] overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">Product Inventory Catalog</h3>
          </div>

          {isLoading ? (
            <p className="p-6 text-xs text-slate-400">Loading catalog...</p>
          ) : products.length === 0 ? (
            <p className="p-12 text-xs text-slate-400 text-center">No products found. Add some using the button above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 font-bold border-b border-slate-100 dark:border-slate-800 uppercase text-[9px] tracking-wider">
                    <th className="px-6 py-3">Product Info</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Pricing (₹)</th>
                    <th className="px-6 py-3">Stock level</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {products.map((prod) => {
                    const low = prod.stock < 10;
                    return (
                      <tr key={prod._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        {/* Info details */}
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 p-1 flex-shrink-0 flex items-center justify-center">
                            <img src={prod.images[0]} alt={prod.name} className="max-h-full object-contain" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-850 dark:text-slate-150 line-clamp-1">{prod.name}</p>
                            <p className="text-[9px] text-slate-400">{prod.unit}</p>
                          </div>
                        </td>
                        
                        {/* Category */}
                        <td className="px-6 py-4 text-[10px] text-slate-450 uppercase font-semibold">
                          {prod.category?.name || 'General'}
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          ₹{prod.discountPrice || prod.price}
                          {prod.discountPrice && (
                            <span className="text-[9px] text-slate-400 line-through block font-normal">₹{prod.price}</span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {low && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />}
                            <span className={`font-bold ${low ? 'text-amber-500' : 'text-slate-750 dark:text-slate-200'}`}>
                              {prod.stock} items
                            </span>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(prod)}
                              className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-500 rounded-xl"
                              title="Edit item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(prod._id)}
                              className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-500 rounded-xl"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
