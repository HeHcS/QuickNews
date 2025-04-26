'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/ui/BottomNav';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual authentication
    router.push('/foryou');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome to QuickNews</h1>
            <p className="text-white/70">
              {isLogin ? 'Log in to your account' : 'Create your account'}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-full transition-colors ${
                isLogin ? 'bg-[#29ABE2] text-white' : 'bg-white/10 text-white/70'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-full transition-colors ${
                !isLogin ? 'bg-[#29ABE2] text-white' : 'bg-white/10 text-white/70'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form or Contact Message */}
          {isLogin ? (
            <>
              <p className="text-center text-white/80 mb-4">Log in to use this feature</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]"
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-[#29ABE2] text-white rounded-lg hover:bg-[#1a8ab8] transition-colors"
                >
                  Log In
                </button>
              </form>
            </>
          ) : (
            <div className="text-center p-6 bg-white/5 rounded-lg">
              <p className="text-white/80 mb-4">Contact us through telegram or email to register for an account.</p>
              <div className="flex flex-col space-y-3">
                <div className="py-2 px-4 bg-[#29ABE2] text-white rounded-lg opacity-70 cursor-not-allowed">
                  Telegram
                </div>
                <div className="py-2 px-4 bg-white/10 text-white rounded-lg opacity-70 cursor-not-allowed">
                  Email
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0">
        <BottomNav />
      </div>
    </div>
  );
} 