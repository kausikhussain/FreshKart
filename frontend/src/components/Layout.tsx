import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      
      {/* Premium background decorative shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-emerald-400/5 dark:bg-emerald-500/5 blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[45%] aspect-square rounded-full bg-amber-400/5 dark:bg-amber-500/3 blur-[120px] pointer-events-none -z-10"></div>

      {/* Navigation */}
      <Navbar />

      {/* Main content body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
