'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ShoppingBag, KeyRound, Mail, User, Phone, CheckSquare, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuthStore, IUser } from '@/store/authStore';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'delivery'>('customer');
  const [errorMsg, setErrorMsg] = useState('');

  // Register mutation
  const signupMutation = useMutation({
    mutationFn: (body: any) =>
      apiRequest<{ token: string; user: IUser }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    onSuccess: (data) => {
      login(data.user, data.token);
      router.push('/');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Registration failed. Try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) return;
    signupMutation.mutate({ name, email, password, phone, role });
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
          <h2 className="font-heading text-xl font-bold text-slate-850 dark:text-white">Create Account</h2>
          <p className="text-xs text-slate-400 mt-1">Get fresh essentials delivered in minutes.</p>
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
              Full Name
            </label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
              <User className="w-4.5 h-4.5 text-slate-450" />
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-grow bg-transparent ml-3 text-slate-800 dark:text-slate-150 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
              <Mail className="w-4.5 h-4.5 text-slate-450" />
              <input
                type="email"
                placeholder="e.g. john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow bg-transparent ml-3 text-slate-800 dark:text-slate-150 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
              <Phone className="w-4.5 h-4.5 text-slate-450" />
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-grow bg-transparent ml-3 text-slate-800 dark:text-slate-150 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
              <KeyRound className="w-4.5 h-4.5 text-slate-450" />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-grow bg-transparent ml-3 text-slate-800 dark:text-slate-150 focus:outline-none"
                minLength={6}
                required
              />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Register As
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-2 px-4 rounded-xl border font-bold transition-all text-center ${role === 'customer' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('delivery')}
                className={`py-2 px-4 rounded-xl border font-bold transition-all text-center ${role === 'delivery' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600' : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}
              >
                Delivery Partner
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={signupMutation.isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 text-xs disabled:opacity-50 mt-6"
          >
            Register Account
            <CheckSquare className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-emerald-500 hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
