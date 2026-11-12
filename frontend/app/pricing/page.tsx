"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  ArrowRight, 
  Sparkles, 
  FileSearch, 
  Newspaper, 
  FileText, 
  ShieldAlert, 
  Zap, 
  ShieldCheck, 
  HelpCircle,
  Layers,
  Key
} from 'lucide-react';

interface ExtensionPricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: string;
  quarterlyPrice: string;
  quarterlyMonthlyEquivalent: string;
  freeQuota: string;
  freeQuotaLabel: string;
  icon: any;
  accent: string;
  borderAccent: string;
  badge: string;
  badgeColor: string;
  status: 'active' | 'in_labs' | 'coming_soon';
  features: string[];
}

export default function PricingOverviewPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly'>('monthly');

  const extensions: ExtensionPricingPlan[] = [
    {
      id: 'notesgpt',
      name: 'NotesGPT Studio',
      tagline: 'Multimodal video lecture capture, bilateral mind maps & bilingual synthesis.',
      monthlyPrice: '$6.99',
      quarterlyPrice: '$14.99',
      quarterlyMonthlyEquivalent: '$4.99',
      freeQuota: '20 min / day',
      freeQuotaLabel: '3-Day Free Trial',
      icon: Sparkles,
      accent: 'text-purple-400',
      borderAccent: 'border-purple-500/40 hover:border-purple-500/80',
      badge: 'MOST POPULAR',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      status: 'active',
      features: [
        'Sub-1s Gemini Flash Multimodal Ingestion',
        '250 High-Resolution lecture captures / day',
        'Interactive SVG Flowcharts & Vector Mind Maps',
        'Bilingual English, Hinglish & Formal Hindi support',
        '1-Click Obsidian (.md) & Notion formatted export',
        'Hardware-locked JWT sync for browser extension',
      ],
    },
    {
      id: 'portalsnap',
      name: 'PortalSnap Pro',
      tagline: 'Instant 60-page PSU & Govt exam PDF eligibility verification matrix.',
      monthlyPrice: '$4.99',
      quarterlyPrice: '$11.99',
      quarterlyMonthlyEquivalent: '$3.99',
      freeQuota: '10 forms / month',
      freeQuotaLabel: 'Free Community Tier',
      icon: FileSearch,
      accent: 'text-cyan-400',
      borderAccent: 'border-cyan-500/40 hover:border-cyan-500/80',
      badge: 'HIGH EFFICIENCY',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      status: 'active',
      features: [
        'Instant 60-page PDF parsing with paragraph citations',
        'Automated degree, age & reservation eligibility matrix',
        'Google Calendar deadline & admit card sync',
        'Syllabus topic weightage & negative marking matrix',
        'Zero-telemetry local sandboxed processing',
      ],
    },
    {
      id: 'editoriallens',
      name: 'EditorialLens',
      tagline: 'UPSC Mains GS-1/4 editorial argument trees and syllabus point matcher.',
      monthlyPrice: '$8.99',
      quarterlyPrice: '$19.99',
      quarterlyMonthlyEquivalent: '$6.66',
      freeQuota: 'Queue Position #14',
      freeQuotaLabel: 'Early Labs Preview',
      icon: Newspaper,
      accent: 'text-emerald-400',
      borderAccent: 'border-emerald-500/40 hover:border-emerald-500/80',
      badge: 'IN LABS',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      status: 'in_labs',
      features: [
        'Mains syllabus point mapping across national dailies',
        'Bilateral pros, cons, and committee recommendation citations',
        'Automated Anki & Notion flashcard continuous sync',
        'Contextual bias detection HUD for research essays',
        'Priority queue access for upcoming beta releases',
      ],
    },
    {
      id: 'docusynth',
      name: 'DocuSynth AI',
      tagline: 'Universal research paper & technical thesis equation synthesizer.',
      monthlyPrice: '$6.99',
      quarterlyPrice: '$15.99',
      quarterlyMonthlyEquivalent: '$5.33',
      freeQuota: 'Queue Position #42',
      freeQuotaLabel: 'Private Beta',
      icon: FileText,
      accent: 'text-blue-400',
      borderAccent: 'border-blue-500/30 opacity-80',
      badge: 'COMING SOON',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      status: 'coming_soon',
      features: [
        'LaTeX mathematical formula distillation from ArXiv PDFs',
        'Cross-document citation graphing and contradiction checks',
        'Audio narrative synthesis for commute listening',
      ],
    },
    {
      id: 'codeaudit',
      name: 'CodeAudit Shield',
      tagline: 'Git security, credential leak prevention, and automated PR CVE audits.',
      monthlyPrice: '$9.99',
      quarterlyPrice: '$23.99',
      quarterlyMonthlyEquivalent: '$7.99',
      freeQuota: 'Queue Position #58',
      freeQuotaLabel: 'Private Beta',
      icon: ShieldAlert,
      accent: 'text-amber-400',
      borderAccent: 'border-amber-500/30 opacity-80',
      badge: 'COMING SOON',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      status: 'coming_soon',
      features: [
        'Pre-commit regex and entropy secret leak defense',
        'Dependency vulnerability auditing with fix recommendations',
        'Inline GitHub PR security review comments',
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-14 text-center">
      {/* Header & Subtitle */}
      <div className="space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-purple-400 purple-glass-pill px-3 py-1 rounded-full">
          Transparent Fleet Pricing
        </span>
        <h1 className="font-editorial text-4xl sm:text-6xl text-[var(--text-main)] font-normal">
          Distinct pricing for each <span className="italic text-[#ff7a59]">specialized workflow.</span>
        </h1>
        <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
          Pay only for the exact tools you use. Every active plan generates a hardware-locked JWT token that connects directly into your browser extension.
        </p>

        {/* Monthly / Quarterly Switcher */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-white/5 border border-[var(--card-border)]">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                billingCycle === 'quarterly'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>3-Month Quarterly</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SAVE 30%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Active Extensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {extensions.slice(0, 3).map((prod) => {
          const Icon = prod.icon;
          const displayPrice = billingCycle === 'quarterly' ? prod.quarterlyMonthlyEquivalent : prod.monthlyPrice;
          const billingDetail = billingCycle === 'quarterly' ? `Billed ${prod.quarterlyPrice} every 3 months` : 'Billed monthly, cancel anytime';

          return (
            <div
              key={prod.id}
              className={`glass-card p-7 flex flex-col justify-between space-y-6 relative transition-all duration-200 ${prod.borderAccent}`}
            >
              <div>
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${prod.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${prod.badgeColor}`}>
                    {prod.badge}
                  </span>
                </div>

                {/* Name & Tagline */}
                <h3 className="text-xl font-bold text-[var(--text-main)] mt-4">
                  {prod.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed min-h-[36px]">
                  {prod.tagline}
                </p>

                {/* Price Display */}
                <div className="mt-6 flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold font-mono text-[var(--text-main)]">
                      {displayPrice}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">/ month</span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
                    {billingDetail}
                  </span>
                </div>

                {/* Free Quota Notice */}
                <div className="mt-4 p-2.5 rounded-xl bg-white/[0.03] border border-[var(--card-border)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] font-mono text-[11px]">{prod.freeQuotaLabel}:</span>
                  <span className="font-mono text-purple-300 font-semibold text-[11px]">{prod.freeQuota}</span>
                </div>

                {/* Feature Checklist */}
                <div className="mt-6 space-y-2.5 pt-4 border-t border-[var(--card-border)]">
                  {prod.features.map((feat, idx) => (
                    <div key={idx} className="text-xs text-[var(--text-main)] flex items-start gap-2">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${prod.accent}`} />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-2">
                <Link
                  href={`/pricing/${prod.id}`}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs text-center flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01]"
                >
                  Configure {prod.name} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Fleet Extensions Grid */}
      <div className="space-y-5 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Upcoming Fleet Tools (In Lab &amp; Private Beta)
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-mono">Access via waitlist</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {extensions.slice(3).map((prod) => {
            const Icon = prod.icon;
            return (
              <div
                key={prod.id}
                className={`glass-card p-6 flex flex-col justify-between space-y-4 border ${prod.borderAccent}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${prod.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[var(--text-main)]">{prod.name}</h4>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">Planned Launch: {prod.monthlyPrice}/mo</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${prod.badgeColor}`}>
                      {prod.badge}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mt-3 leading-relaxed">
                    {prod.tagline}
                  </p>

                  <div className="mt-4 space-y-1.5 pt-3 border-t border-[var(--card-border)]">
                    {prod.features.map((feat, idx) => (
                      <div key={idx} className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">{prod.freeQuota}</span>
                  <Link
                    href="/dashboard"
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    View Queue in Dashboard →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Master Admin / Super Admin Privileges Callout */}
      <div className="glass-card p-8 border-purple-500/30 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              Super Admin Fleet License
            </span>
            <span className="text-xs font-mono text-purple-400 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              Permanent Key
            </span>
          </div>
          <h3 className="text-xl font-bold text-[var(--text-main)]">
            Lifetime Access &amp; Multi-Extension Token
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-xl leading-relaxed">
            Admin accounts receive permanent, unlimited usage tokens valid across all present and future extensions in the AQVONX fleet with zero daily limits or expiration.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs whitespace-nowrap flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          Open Management Dashboard
        </Link>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto space-y-6 text-left pt-6">
        <h2 className="text-xl font-bold text-[var(--text-main)] text-center font-editorial">
          Frequently Answered Questions
        </h2>

        <div className="space-y-4 text-xs">
          <div className="glass-card p-5 space-y-1.5">
            <h4 className="font-semibold text-[var(--text-main)] text-sm">
              How does the 3-day free trial work for NotesGPT?
            </h4>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Every new account receives 3 days of unrestricted access with a generous 20 minutes/day active playback allocation. No credit card is required to begin.
            </p>
          </div>

          <div className="glass-card p-5 space-y-1.5">
            <h4 className="font-semibold text-[var(--text-main)] text-sm">
              How do I link my purchased subscription to the Chrome Extension?
            </h4>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Visit your Dashboard after signing in. Your hardware-locked JWT token is automatically dispatched to the extension via our 1-Click Connect handshake bridge, or you can paste the token manually into the extension settings.
            </p>
          </div>

          <div className="glass-card p-5 space-y-1.5">
            <h4 className="font-semibold text-[var(--text-main)] text-sm">
              What payment methods are supported?
            </h4>
            <p className="text-[var(--text-muted)] leading-relaxed">
              We support both international cards (Visa, Mastercard, Amex via LemonSqueezy) and local Indian UPI Autopay / Netbanking via Razorpay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
