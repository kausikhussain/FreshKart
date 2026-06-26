'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Mic, Sparkles, AlertCircle, ShoppingBag, X, MicOff } from 'lucide-react';
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

interface AISearchResponse {
  query: string;
  aiAnalysis: {
    detectedCategories: string[];
    filtersApplied: {
      highProtein: boolean;
      lowFat: boolean;
      organic: boolean;
      discount: boolean;
    };
    confidence: number;
  };
  results: Product[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceQueryIndex, setVoiceQueryIndex] = useState(0);

  // Debounce query inputs
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 505);

    return () => clearTimeout(handler);
  }, [query]);

  // Fetch search results
  const { data, isLoading } = useQuery<AISearchResponse>({
    queryKey: ['ai-search', debouncedQuery],
    queryFn: () =>
      apiRequest<AISearchResponse>('/products/ai-search', {
        params: { query: debouncedQuery }
      }),
    enabled: debouncedQuery.length > 2,
    placeholderData: undefined
  });

  const handleVoiceSearchStart = () => {
    setIsListening(true);
    
    // Cycle through mock speech inputs
    const mockSpeeches = [
      'Get fresh red onions and whole milk',
      'Show me healthy breakfast cereals and organic apples',
      'I want soft drinks and potato chips for tonight'
    ];

    setTimeout(() => {
      setQuery(mockSpeeches[voiceQueryIndex]);
      setVoiceQueryIndex((prev) => (prev + 1) % mockSpeeches.length);
      setIsListening(false);
    }, 3000);
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  const searchResults = data?.results || [];
  const aiAnalysis = data?.aiAnalysis;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
          Smart Semantic Search
          <Sparkles className="w-6 h-6 text-emerald-500 fill-emerald-500/20" />
        </h1>
        <p className="text-xs text-slate-400 mb-8 leading-relaxed">
          Type queries naturally like &quot;organic fruits for diet&quot; or &quot;party snacks with offers&quot; to see our AI semantic tags filter items automatically.
        </p>

        {/* Voice Search Listening Overlay */}
        {isListening && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 text-center max-w-sm mx-4">
              <div className="relative">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center animate-ping absolute inset-0"></div>
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center relative z-10">
                  <Mic className="w-8 h-8 text-emerald-500 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-1">Listening to voice...</h3>
                <p className="text-xs text-slate-400">Say &quot;Fresh milk and bread&quot; or &quot;organic vegetables&quot;</p>
              </div>
              {/* Voice Waves Simulation */}
              <div className="flex gap-1 h-6 items-end">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-emerald-500 rounded-full animate-pulse"
                    style={{
                      height: `${Math.floor(Math.random() * 20) + 6}px`,
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Input Box */}
        <div className="relative mb-8 shadow-md rounded-2xl flex items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 px-4 py-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search groceries with AI: try 'discount beverages' or 'fresh onions'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow bg-transparent text-sm ml-3 text-slate-800 dark:text-slate-150 focus:outline-none placeholder-slate-400"
            autoFocus
          />
          
          {query && (
            <button onClick={handleClear} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 mr-2">
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleVoiceSearchStart}
            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-all"
            title="Voice Search"
          >
            <Mic className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* AI Intent analysis report */}
        {aiAnalysis && (
          <div className="bg-emerald-500/10 border border-emerald-500/15 rounded-3xl p-5 mb-8 shadow-xs text-xs space-y-3">
            <h3 className="font-heading font-black text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              FreshKart AI Engine Analysis
            </h3>
            <p className="text-slate-650 dark:text-slate-350 leading-relaxed pl-1">
              For query &quot;<span className="italic font-bold text-slate-900 dark:text-white">{query}</span>&quot;, we detected intent for{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {aiAnalysis.detectedCategories.join(', ') || 'general products'}
              </span>
              .{' '}
              {Object.values(aiAnalysis.filtersApplied).some(Boolean) && (
                <>
                  Applied filters:{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {Object.entries(aiAnalysis.filtersApplied)
                      .filter(([_, applied]) => applied)
                      .map(([filter]) => filter.replace(/([A-Z])/g, ' $1').toLowerCase())
                      .join(', ')}
                  </span>
                  .
                </>
              )}
            </p>
          </div>
        )}

        {/* Results display */}
        {debouncedQuery.length > 2 && isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-4 animate-pulse flex flex-col gap-4">
                <div className="w-full aspect-square bg-slate-100 dark:bg-slate-950 rounded-2xl"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-950 rounded w-2/3"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-950 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : debouncedQuery.length > 2 && searchResults.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-12 rounded-[2.5rem] text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">No products found</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">We couldn&apos;t find any items matching your request. Try typing generic keywords like &quot;milk&quot;, &quot;vegetables&quot; or &quot;chips&quot;.</p>
          </div>
        ) : debouncedQuery.length <= 2 ? (
          // Suggestions box
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[2.5rem] p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Trending Searches</h3>
            <div className="flex flex-wrap gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              {['Fresh farm vegetables', 'Robusta banana', '1.25L Coca Cola', 'Amul butter', 'Whole wheat bread', 'Salted potato chips'].map((kw) => (
                <button
                  key={kw}
                  onClick={() => setQuery(kw)}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl transition-all font-medium"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Grid
          <div>
            <h2 className="font-heading text-lg font-black text-slate-900 dark:text-white mb-6">Search Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {searchResults.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
