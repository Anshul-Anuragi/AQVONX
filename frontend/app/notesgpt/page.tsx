"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Zap, 
  Check, 
  Sparkles, 
  Chrome, 
  Download, 
  FileText, 
  Layers, 
  Share2, 
  ArrowRight,
  ShieldAlert,
  Play,
  Copy,
  Clock,
  CheckCircle2
} from "lucide-react";

export default function NotesGPTPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [copied, setCopied] = useState(false);

  const architecturePreviewSVG = (
    <svg viewBox="0 0 760 170" fill="none" className="w-full h-auto">
      <defs>
        <linearGradient id="demo-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect width="760" height="170" rx="14" fill="#0B1120" stroke="#1E293B" strokeWidth="1" />
      
      {/* Node 1 */}
      <rect x="25" y="45" width="180" height="75" rx="10" fill="#131C31" stroke="#38BDF8" strokeWidth="1.5" />
      <text x="115" y="78" fill="#F8FAFC" fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Video Feed</text>
      <text x="115" y="98" fill="#94A3B8" fontSize="11" textAnchor="middle" fontFamily="sans-serif">Frame Window + Audio</text>

      {/* Path 1 */}
      <path d="M 205 82 L 275 82" stroke="url(#demo-grad)" strokeWidth="2.5" />

      {/* Node 2 */}
      <rect x="275" y="35" width="210" height="95" rx="12" fill="#18233C" stroke="#818CF8" strokeWidth="2" />
      <text x="380" y="72" fill="#00F0FF" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">AQVONX Flash Engine</text>
      <text x="380" y="94" fill="#CBD5E1" fontSize="11" textAnchor="middle" fontFamily="sans-serif">Sub-1s Multimodal Synthesis</text>
      <text x="380" y="112" fill="#6EE7B7" fontSize="10" textAnchor="middle" fontFamily="monospace">STATUS: OK (340ms)</text>

      {/* Path 2 */}
      <path d="M 485 82 L 555 82" stroke="url(#demo-grad)" strokeWidth="2.5" />

      {/* Node 3 */}
      <rect x="555" y="45" width="180" height="75" rx="10" fill="#131C31" stroke="#34D399" strokeWidth="1.5" />
      <text x="645" y="78" fill="#F8FAFC" fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">Instant Mind Map</text>
      <text x="645" y="98" fill="#94A3B8" fontSize="11" textAnchor="middle" fontFamily="sans-serif">Markdown &amp; Vector SVG</text>
    </svg>
  );

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-500/15 blur-[120px] pointer-events-none" />

      {/* Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full purple-glass-pill text-xs font-mono text-purple-300 mb-6">
          <Zap className="w-3.5 h-3.5" />
          OFFICIAL CHROME EXTENSION • POWERED BY AQVONX
        </div>

        <h1 className="font-editorial text-5xl sm:text-7xl font-normal text-[var(--text-main)] tracking-tight leading-tight">
          NotesGPT <span className="italic text-[#ff7a59]">Studio</span>
        </h1>
        <p className="mt-4 text-base sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
          Turn hours of video lectures, webinars, and meetings into crisp Obsidian-ready Markdown notes and visual vector SVG mind maps in real time.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm shadow-xl shadow-purple-500/25 transition-all hover:scale-105"
          >
            <Chrome className="w-4 h-4" />
            Add to Chrome (Free)
          </a>

          <Link
            href="/docs/notesgpt"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-card text-[var(--text-main)] hover:border-purple-400 text-sm font-medium transition"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            Read Setup Docs
          </Link>
        </div>
      </section>

      {/* Interactive Mock Interface Showcase */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="font-mono text-[var(--text-muted)] ml-2">NotesGPT Sidepanel HUD — Active Capture</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Gemini Flash 2.5 Active
            </div>
          </div>

          {/* Simulated content preview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider">Live Synthesis Markdown</span>
                <button
                  onClick={() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? "Copied!" : "Copy MD"}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-[var(--card-border)] font-mono text-xs text-[var(--text-main)] leading-relaxed space-y-2">
                <div className="text-purple-300 font-bold"># Distributed Event Broker Architecture</div>
                <div className="text-[var(--text-muted)] italic">Distilled from 48-minute system design lecture:</div>
                <ul className="list-disc pl-4 space-y-1 text-[var(--text-muted)]">
                  <li><strong className="text-[var(--text-main)]">Partition Strategy:</strong> Murmur3 hash mapping keys across Kafka brokers.</li>
                  <li><strong className="text-[var(--text-main)]">Backpressure Control:</strong> Reactive Streams pull semantics prevent buffer saturation.</li>
                  <li><strong className="text-[var(--text-main)]">Zero Copy:</strong> OS sendfile system call cuts user-kernel context switching.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider block">Generated Vector Flowchart</span>
              <div className="p-2 rounded-xl bg-black/40 border border-[var(--card-border)] flex items-center justify-center">
                {architecturePreviewSVG}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Table (Free vs Pro ₹149/mo) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="font-editorial text-4xl sm:text-5xl font-normal text-[var(--text-main)]">Simple, Transparent Pricing</h2>
          <p className="mt-2 text-[var(--text-muted)] text-sm">Start for free with 5 daily syntheses, or unlock unlimited potential with Pro.</p>

          {/* Toggle */}
          <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-white/5 border border-[var(--card-border)]">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                billingCycle === "monthly" ? "bg-purple-600 text-white font-semibold" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                billingCycle === "annual" ? "bg-purple-600 text-white font-semibold" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Annual Billing
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">SAVE 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="glass-card p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-lg font-bold text-[var(--text-main)]">Community Free</div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Perfect for casual learners and weekly webinars.</p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-[var(--text-main)]">₹0</span>
                <span className="text-[var(--text-muted)] text-sm ml-2">/ forever</span>
              </div>

              <ul className="mt-8 space-y-3 text-sm text-[var(--text-muted)]">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <strong className="text-[var(--text-main)]">5 Daily</strong> Gemini Flash syntheses
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  Standard Markdown note formatting
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  Obsidian &amp; Notion clipboard copy
                </li>
                <li className="flex items-center gap-3 text-slate-500">
                  <span className="w-4 h-4 shrink-0 text-center">—</span>
                  Dynamic SVG Flowchart exports (Pro only)
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--card-border)]">
              <a
                href="https://chromewebstore.google.com"
                target="_blank"
                rel="noreferrer"
                className="w-full block text-center py-3 rounded-xl border border-[var(--card-border)] hover:border-purple-400 text-[var(--text-main)] font-semibold text-sm transition"
              >
                Install Free Extension
              </a>
            </div>
          </div>

          {/* Pro Tier (₹149/mo) */}
          <div className="glass-card p-8 rounded-2xl border-2 border-purple-500/50 relative flex flex-col justify-between shadow-2xl shadow-purple-500/10">
            <div className="absolute -top-3.5 right-6">
              <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold font-mono tracking-wider shadow">
                MOST POPULAR
              </span>
            </div>

            <div>
              <div className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                NotesGPT Pro
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">For researchers, developers, students, and engineers.</p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-[var(--text-main)]">
                  {billingCycle === "monthly" ? "₹149" : "₹119"}
                </span>
                <span className="text-[var(--text-muted)] text-sm ml-2">/ month</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {billingCycle === "annual" ? "Billed annually (₹1,428/yr)" : "Cancel anytime in dashboard"}
              </div>

              <ul className="mt-8 space-y-3 text-sm text-[var(--text-muted)]">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <strong className="text-[var(--text-main)]">250 Daily</strong> High-speed Flash requests
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <strong className="text-[var(--text-main)]">Dynamic Vector SVG Flowcharts</strong> &amp; mind maps
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  Multilingual translation &amp; notes (15+ languages)
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  Priority sub-500ms server response pipeline
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  Razorpay UPI / Card &amp; LemonSqueezy Checkout
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--card-border)]">
              <Link
                href="/pricing/notesgpt"
                className="w-full block text-center py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
              >
                Upgrade to Pro (₹149/mo)
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

