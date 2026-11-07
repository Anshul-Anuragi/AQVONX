'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn('credentials', {
        email: cleanEmail,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (res?.error) {
        setErrorMsg('Authentication failed. Please verify your email.');
      } else {
        router.push(res?.url || '/dashboard');
        router.refresh();
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="glass-card max-w-md w-full p-8 space-y-6 text-center border-purple-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-2xl purple-glass-pill mx-auto flex items-center justify-center font-bold text-lg text-purple-300">
          A
        </div>

        <div className="space-y-2">
          <h1 className="font-editorial text-4xl text-[var(--text-main)] tracking-tight font-normal">
            Welcome to AQVONX
          </h1>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            One account connects your licenses across NotesGPT, PortalSnap, and EditorialLens.
          </p>
        </div>

        {/* Google One-Click Sign In Button */}
        <div className="pt-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-70"
          >
            {isGoogleLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Modern OR Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-[var(--card-border)]" />
          <span className="absolute px-3 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] bg-[var(--card-bg)]">
            or continue with email
          </span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@aqvonx.com"
                disabled={isLoading || isGoogleLoading}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-[var(--card-border)] text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-purple-400 transition-colors"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Sign In with Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--card-border)] text-[11px] text-[var(--text-muted)] space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[var(--text-muted)]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hardware-bound token security &amp; encrypted sessions.</span>
          </div>
          <p>
            By continuing, you agree to the{' '}
            <Link href="/docs" className="text-purple-400 hover:underline">Terms</Link> and{' '}
            <Link href="/docs" className="text-purple-400 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
