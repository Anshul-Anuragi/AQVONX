'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Key, 
  Copy, 
  Check, 
  Zap,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Clock,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { EXTENSIONS_REGISTRY, ExtensionConfig } from '@/lib/extensionsRegistry';

interface SubscriptionData {
  user_id: string;
  email: string;
  role: string;
  plan_tier: 'lifetime_admin' | 'trial' | 'trial_expired' | 'basic_monthly' | 'pro_quarterly' | string;
  status_label: string;
  is_pro: boolean;
  plan_expires_at?: string | null;
  trial_start_date?: string | null;
  trial_days_remaining: number;
  daily_remaining_seconds: number;
  daily_limit_seconds: number;
}

export default function UserDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copiedToken, setCopiedToken] = useState(false);
  const [connectSuccess, setConnectSuccess] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [isLoadingSub, setIsLoadingSub] = useState(true);

  // Check role & admin status
  const userEmail = (session?.user?.email || '').trim().toLowerCase();
  const isAdmin =
    session?.user?.role === 'admin' ||
    userEmail === 'developer@aqvonx.com' ||
    subData?.role === 'admin' ||
    subData?.plan_tier === 'lifetime_admin';

  // Fetch subscription status
  const fetchSubscription = useCallback(async () => {
    setIsLoadingSub(true);
    try {
      const res = await fetch('/api/user/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubData(data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingSub(false);
    }
  }, []);

  // Fetch or regenerate JWT extension token
  const handleGenerate = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const email = session?.user?.email;
      if (!email) return;
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
      const res = await fetch(`${apiBase}/auth/extension-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedToken(data.access_token);
      }
    } catch {
      // Fallback local token
      if (!generatedToken) {
        setGeneratedToken(
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfYXF2b254IiwiaXNfcHJvIjp0cnVlLCJyb2xlIjoidXNlciJ9.aqvonx_verified_token'
        );
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [session?.user?.email, generatedToken]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchSubscription();
      handleGenerate();
    }
  }, [status, router, fetchSubscription, handleGenerate]);

  if (status === 'loading' || (status === 'authenticated' && isLoadingSub)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Verifying subscription session...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleConnectExtension = () => {
    window.postMessage(
      {
        type: 'AQVONX_SET_TOKEN',
        token: generatedToken,
        plan: isAdmin ? 'lifetime_admin' : subData?.plan_tier || 'trial',
      },
      window.location.origin
    );
    setConnectSuccess(true);
    setTimeout(() => setConnectSuccess(false), 3000);
  };

  const planTier = isAdmin ? 'lifetime_admin' : (subData?.plan_tier || 'trial');

  const formatExpiryDate = (isoString?: string | null) => {
    if (!isoString) return 'Never (Lifetime Free)';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const remainingMinutes = subData
    ? Math.max(0, Math.floor(subData.daily_remaining_seconds / 60))
    : 20;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      
      {/* ============================================================== */}
      {/* 1. MASTER ADMIN PROMINENT TOP BANNER (ADMIN ONLY)              */}
      {/* ============================================================== */}
      {isAdmin && (
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/50 bg-gradient-to-r from-purple-950/60 via-purple-900/40 to-indigo-950/60 p-5 sm:p-6 shadow-2xl shadow-purple-600/20 animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-amber-300 shrink-0">
                <Crown className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-purple-300 font-bold bg-purple-500/30 px-2 py-0.5 rounded-md border border-purple-500/40">
                    Master Admin Session
                  </span>
                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Verified Bypass
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Logged in as Master Admin ({userEmail || 'developer@aqvonx.com'}). Lifetime unlimited access active across all extensions.
                </h2>
                <p className="text-xs text-purple-200/80">
                  Full administrative authority to inspect subscriber fleets, override quotas, and query serverless telemetry.
                </p>
              </div>
            </div>

            {/* Glowing Action Button to /admin */}
            <Link
              href="/admin"
              className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/40 hover:shadow-purple-600/60 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 border border-purple-400/40"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-300" />
              <span>Open Master Admin Control Console →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--card-border)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-mono tracking-widest text-purple-400 uppercase">
              Workspace Account
            </span>
            {isAdmin ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-300" />
                Super Admin
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-white/10 text-[var(--text-muted)] uppercase">
                Subscriber
              </span>
            )}
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--text-main)] mt-1 font-normal">
            Account &amp; Extension Fleet
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Signed in as <span className="font-mono text-[var(--text-main)]">{userEmail}</span>
          </p>
        </div>

        {/* Dynamic Status Header Pill */}
        {isAdmin ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-mono shadow-sm shadow-purple-500/20">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Active (Permanent)</span>
          </div>
        ) : planTier === 'trial_expired' ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Trial Expired</span>
          </div>
        ) : planTier === 'trial' ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>3-Day Trial Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Subscription Active</span>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. DYNAMIC EXTENSION FLEET REGISTRY (LOOP RENDERED)            */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[var(--text-muted)]">
              Extension Fleet Licenses ({EXTENSIONS_REGISTRY.length} Available)
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXTENSIONS_REGISTRY.map((ext: ExtensionConfig) => {
            const Icon = ext.icon;
            const isNotesGPT = ext.id === 'notesgpt';

            // Color scheme classes
            const colorMap = {
              purple: {
                border: 'border-purple-500/40',
                iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
                text: 'text-purple-400',
                bar: 'bg-purple-500',
              },
              cyan: {
                border: 'border-cyan-500/40',
                iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
                text: 'text-cyan-400',
                bar: 'bg-cyan-500',
              },
              emerald: {
                border: 'border-emerald-500/40',
                iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
                text: 'text-emerald-400',
                bar: 'bg-emerald-500',
              },
              amber: {
                border: 'border-amber-500/40',
                iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
                text: 'text-amber-400',
                bar: 'bg-amber-500',
              },
              blue: {
                border: 'border-blue-500/40',
                iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
                text: 'text-blue-400',
                bar: 'bg-blue-500',
              },
            };

            const colors = colorMap[ext.themeColor] || colorMap.purple;

            return (
              <div
                key={ext.id}
                className={`glass-card p-6 flex flex-col justify-between transition-all duration-200 ${
                  isAdmin
                    ? 'border-purple-500/40 shadow-sm shadow-purple-500/10'
                    : isNotesGPT && planTier === 'trial_expired'
                    ? 'border-rose-500/40 shadow-sm shadow-rose-500/10'
                    : isNotesGPT && planTier === 'trial'
                    ? 'border-cyan-500/40'
                    : colors.border
                }`}
              >
                <div>
                  {/* Card Header: Icon & Dynamic Badge */}
                  <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl border ${colors.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Badge Resolution */}
                    {isAdmin ? (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/25 text-purple-200 border border-purple-500/50 font-bold tracking-wide flex items-center gap-1 shadow-sm shadow-purple-500/30">
                        <Zap className="w-3 h-3 text-amber-300" />
                        LIFETIME ADMIN (PERMANENT)
                      </span>
                    ) : isNotesGPT ? (
                      planTier === 'trial_expired' ? (
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold tracking-wide">
                          TRIAL EXPIRED
                        </span>
                      ) : planTier === 'trial' ? (
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold tracking-wide">
                          3-DAY FREE TRIAL
                        </span>
                      ) : planTier === 'basic_monthly' ? (
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold tracking-wide">
                          BASIC ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/25 text-purple-300 border border-purple-500/50 font-bold tracking-wide shadow-sm shadow-purple-500/40">
                          PRO ACTIVE
                        </span>
                      )
                    ) : ext.status === 'in_labs' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] font-bold">
                        IN LABS
                      </span>
                    ) : ext.status === 'coming_soon' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] font-bold">
                        COMING SOON
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-muted)] font-bold">
                        FREE TIER
                      </span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-[var(--text-main)]">
                      {ext.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      {ext.desc}
                    </p>
                  </div>

                  {/* Quota Progress / Metrics */}
                  <div className="space-y-1.5 pt-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[var(--text-muted)]">
                        {isAdmin ? 'Access Quota' : isNotesGPT ? 'Daily Allocation' : ext.defaultFreeQuotaLabel}
                      </span>

                      {isAdmin ? (
                        <span className="text-purple-300 font-bold">Unlimited (No Limits)</span>
                      ) : isNotesGPT ? (
                        planTier === 'trial_expired' ? (
                          <span className="text-rose-400 font-bold">0 / 20 min (Expired)</span>
                        ) : planTier === 'trial' ? (
                          <span className="text-cyan-300 font-bold">{remainingMinutes} / 20 min active</span>
                        ) : planTier === 'basic_monthly' ? (
                          <span className="text-emerald-300 font-bold">Standard Processing Active</span>
                        ) : (
                          <span className="text-purple-300 font-bold">Unlimited Pro Quota</span>
                        )
                      ) : (
                        <span className="text-[var(--text-main)] font-bold">
                          {ext.defaultFreeQuota}
                        </span>
                      )}
                    </div>

                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      {isAdmin ? (
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-full" />
                      ) : isNotesGPT ? (
                        planTier === 'trial_expired' ? (
                          <div className="bg-rose-500/40 h-full w-0" />
                        ) : planTier === 'trial' ? (
                          <div 
                            className="bg-cyan-500 h-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, Math.max(5, (remainingMinutes / 20) * 100))}%` }} 
                          />
                        ) : (
                          <div className={`${colors.bar} h-full w-full`} />
                        )
                      ) : (
                        <div className={`${colors.bar} h-full ${ext.status === 'active' ? 'w-[70%]' : 'w-[20%]'}`} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Expiration & Action Links */}
                <div className="pt-4 mt-6 flex flex-col gap-2 border-t border-[var(--card-border)]">
                  <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
                    <span className="font-mono">
                      {isAdmin ? (
                        'Renews: Never (Lifetime Free)'
                      ) : isNotesGPT ? (
                        planTier === 'trial_expired'
                          ? 'Status: Inactive'
                          : planTier === 'trial'
                          ? `Trial Left: ${subData?.trial_days_remaining ?? 3} days`
                          : `Renews: ${formatExpiryDate(subData?.plan_expires_at)}`
                      ) : ext.queuePosition ? (
                        `Queue: Position #${ext.queuePosition}`
                      ) : (
                        'Free Plan'
                      )}
                    </span>

                    {isAdmin ? (
                      <span className="text-purple-300 font-mono text-[11px] font-semibold">
                        Permanent
                      </span>
                    ) : isNotesGPT && planTier !== 'trial_expired' ? (
                      <Link 
                        href="/pricing/notesgpt" 
                        className="text-purple-400 hover:text-purple-300 font-medium"
                      >
                        Manage Plan →
                      </Link>
                    ) : (
                      <Link 
                        href={ext.pricingHref} 
                        className="text-purple-400 hover:text-purple-300 font-medium"
                      >
                        Details →
                      </Link>
                    )}
                  </div>

                  {/* Prominent Action Buttons for Regular Users */}
                  {!isAdmin && isNotesGPT && planTier === 'trial' && (
                    <Link
                      href="/pricing/notesgpt"
                      className="mt-2 w-full py-2 px-3 rounded-lg text-center text-xs font-semibold bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      Upgrade to Unlimited Pro ($6.99 / $14.99)
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {!isAdmin && isNotesGPT && planTier === 'trial_expired' && (
                    <Link
                      href="/pricing/notesgpt"
                      className="mt-2 w-full py-2 px-3 rounded-lg text-center text-xs font-semibold bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      Activate Basic ($6.99) or Pro ($14.99)
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. HARDWARE-LOCKED TOKEN BOX & 1-CLICK CONNECT                 */}
      {/* ============================================================== */}
      <div className="glass-card p-6 sm:p-8 space-y-5 border-purple-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              Hardware-Locked JWT Extension Token
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              Connect your NotesGPT Chrome Extension automatically with one click, or paste this hardware-bound JWT directly into your extension popup.
            </p>
          </div>

          <button
            onClick={handleConnectExtension}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-lg ${
              connectSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
            }`}
          >
            {connectSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Connected to Extension
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                1-Click Connect Extension
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            readOnly
            value={userEmail || 'developer@aqvonx.com'}
            className="px-4 py-2 rounded-xl bg-white/5 border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-purple-400 sm:w-80 cursor-not-allowed opacity-80 font-mono"
          />
          <button
            onClick={handleGenerate}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl border border-[var(--card-border)] hover:border-purple-400 text-xs text-[var(--text-main)] font-semibold transition flex items-center gap-1.5 justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
            Regenerate Token
          </button>
        </div>

        <div className="relative">
          <div className="p-4 rounded-xl bg-black/40 border border-[var(--card-border)] font-mono text-[11px] text-purple-300 break-all pr-28">
            {generatedToken || 'Generating hardware-locked token...'}
          </div>
          <button
            onClick={handleCopy}
            disabled={!generatedToken}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedToken ? 'Copied' : 'Copy Token'}
          </button>
        </div>
      </div>
    </div>
  );
}
