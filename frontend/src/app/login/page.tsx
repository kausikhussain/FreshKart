'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ShoppingBag, KeyRound, Mail, Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuthStore, IUser } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Signin API Mutation
  const loginMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest<{ token: string; user: IUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    onSuccess: (data) => {
      login(data.user, data.token);
      router.push(redirect);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Invalid email or password');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  };

  const handleGoogleLoginMock = () => {
    // Simulate a successful Google Login response via mock payload
    const mockGooglePayload = {
      googleId: `g_${Math.random().toString(36).substring(2, 11)}`,
      email: 'john_google@gmail.com',
      name: 'John Google Doe',
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
    };
    
    apiRequest<{ token: string; user: IUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(mockGooglePayload)
    })
      .then((data) => {
        login(data.user, data.token);
        router.push(redirect);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Google Auth simulation failed');
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background circles */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-25%] right-[-15%] w-[50%] aspect-square bg-amber-500/3 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative z-10">
        
        {/* Brand logo header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="bg-emerald-505 bg-emerald-500 text-slate-950 p-2 rounded-xl shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fresh<span className="text-emerald-500">Kart</span>
            </span>
          </Link>
          <h2 className="font-heading text-xl font-bold text-slate-850 dark:text-white">Welcome Back!</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to manage addresses, orders, and coupons.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-500 text-xs p-3.5 rounded-2xl flex items-center gap-2 mb-6 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
              <Mail className="w-4.5 h-4.5 text-slate-450" />
              <input
                type="email"
                placeholder="e.g. user@freshkart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow bg-transparent ml-3 text-slate-800 dark:text-slate-150 focus:outline-none"
                required
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Demo login: <span className="font-bold text-emerald-500">user@freshkart.com</span></p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
              <KeyRound className="w-4.5 h-4.5 text-slate-450" />
              <input
                type="password"
                placeholder="e.g. user123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-grow bg-transparent ml-3 text-slate-800 dark:text-slate-150 focus:outline-none"
                required
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Demo password: <span className="font-bold text-emerald-500">user123</span></p>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 text-xs disabled:opacity-50 mt-6"
          >
            Sign In Account
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
          <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 uppercase tracking-widest font-bold">OR</span>
        </div>

        {/* Google Mock checkouts */}
        <button
          onClick={handleGoogleLoginMock}
          className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-amber-500/20" />
          Continue with Google (Simulated)
        </button>

        <p className="text-center text-[10px] text-slate-400 mt-8">
          Don&apos;t have an account yet?{' '}
          <Link href="/signup" className="font-bold text-emerald-500 hover:underline">
            Register now
          </Link>
        </p>

      </div>
    </div>
  );
}
