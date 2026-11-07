'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  FileSearch, 
  Newspaper, 
  Key, 
  Copy, 
  Check, 
  Zap,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export default function UserDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copiedToken, setCopiedToken] = useState(false);
  const [connectSuccess, setConnectSuccess] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTAxMzg4ZC01ODViLTRlZjItOTIxNS04ZGYzMmU2YTFkYTUiLCJlbWFpbCI6ImRldmVsb3BlckBhcXZvbnguY29tIiwiaXNfcHJvIjp0cnVlLCJyb2xlIjoidXNlciJ9.sample_signature_aqvonx'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
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

  const handleGenerate = async () => {
    setIsRefreshing(true);
    try {
      const email = session?.user?.email || 'developer@aqvonx.com';
      const res = await fetch('http://localhost:8000/api/v1/auth/extension-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedToken(data.access_token);
      }
    } catch {
      // Keep sandbox token
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnectExtension = () => {
    window.postMessage(
      {
        type: 'AQVONX_SET_TOKEN',
        token: generatedToken,
        plan: 'pro_quarterly',
      },
      '*'
    );
    setConnectSuccess(true);
    setTimeout(() => setConnectSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--card-border)] pb-6">
        <div>
          <span className="text-[10.5px] font-mono tracking-widest text-purple-400 uppercase">
            Workspace Account
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--text-main)] mt-1 font-normal">
            Account &amp; Extension Licenses
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Signed in as <span className="font-mono text-[var(--text-main)]">{session?.user?.email || 'developer@aqvonx.com'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Subscription Active
        </div>
      </div>

      {/* Extension Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* NotesGPT Studio Card */}
        <div className="glass-card p-6 flex flex-col justify-between border-purple-500/40">
          <div>
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                PRO ACTIVE
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-bold text-[var(--text-main)]">NotesGPT Studio</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Real-time lecture &amp; transcript mind-mapping</p>
            </div>
            <div className="space-y-1.5 pt-4">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">Daily Quota</span>
                <span className="text-purple-300 font-bold">242 / 250 remaining</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[96%]" />
              </div>
            </div>
          </div>
          <div className="pt-4 mt-6 flex justify-between items-center text-xs text-[var(--text-muted)] border-t border-[var(--card-border)]">
            <span className="font-mono">Renews: Dec 05, 2026</span>
            <Link href="/pricing/notesgpt" className="text-purple-400 hover:text-purple-300 font-medium">
              Manage Plan →
            </Link>
          </div>
        </div>

        {/* PortalSnap Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                <FileSearch className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-muted)] font-bold">
                FREE TIER
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-bold text-[var(--text-main)]">PortalSnap Pro</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Form scanning &amp; PDF eligibility engine</p>
            </div>
            <div className="space-y-1.5 pt-4">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">Monthly Forms</span>
                <span className="text-cyan-300 font-bold">7 / 10 remaining</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-[70%]" />
              </div>
            </div>
          </div>
          <div className="pt-4 mt-6 flex justify-between items-center text-xs text-[var(--text-muted)] border-t border-[var(--card-border)]">
            <span className="font-mono">Free Plan</span>
            <Link href="/pricing/portalsnap" className="text-purple-400 hover:text-purple-300 font-medium">
              Upgrade (₹99/mo) →
            </Link>
          </div>
        </div>

        {/* EditorialLens Card */}
        <div className="glass-card p-6 flex flex-col justify-between opacity-85">
          <div>
            <div className="flex justify-between items-start">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <Newspaper className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] font-bold">
                IN LABS
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-bold text-[var(--text-main)]">EditorialLens</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Side-by-side fact checking &amp; citation graph</p>
            </div>
            <p className="text-xs text-[var(--text-muted)] pt-4 leading-relaxed">
              Early preview available for Studio Pro members upon official launch.
            </p>
          </div>
          <div className="pt-4 mt-6 flex justify-between items-center text-xs text-[var(--text-muted)] border-t border-[var(--card-border)] font-mono">
            <span>Queue: Position #14</span>
          </div>
        </div>
      </div>

      {/* Hardware-Locked Token Box & 1-Click Connect */}
      <div className="glass-card p-6 sm:p-8 space-y-5">
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
                ? 'bg-emerald-600 text-white'
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
            value={session?.user?.email || 'developer@aqvonx.com'}
            className="px-4 py-2 rounded-xl bg-white/5 border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-purple-400 sm:w-80 cursor-not-allowed opacity-80"
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
            {generatedToken}
          </div>
          <button
            onClick={handleCopy}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-1.5"
          >
            {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedToken ? 'Copied' : 'Copy Token'}
          </button>
        </div>
      </div>
    </div>
  );
}
