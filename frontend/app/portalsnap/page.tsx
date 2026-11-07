import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Check, 
  FileCheck2, 
  ShieldCheck, 
  Chrome, 
  ArrowRight,
  Layers, 
  FileSpreadsheet
} from "lucide-react";

export default function PortalSnapPage() {
  return (
    <div className="relative overflow-hidden min-h-screen">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-500/15 blur-[120px] pointer-events-none" />

      {/* Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full purple-glass-pill text-xs font-mono text-purple-300 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          OFFICIAL CHROME EXTENSION • POWERED BY AQVONX
        </div>

        <h1 className="font-editorial text-5xl sm:text-7xl font-normal text-[var(--text-main)] tracking-tight leading-tight">
          PortalSnap <span className="italic text-[#ff7a59]">Pro</span>
        </h1>
        <p className="mt-4 text-base sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
          Intelligent Web Form Autofill &amp; PDF Eligibility Scanner. Seamlessly extracts information from identity docs, certificates, and resumes to autofill tedious government &amp; university portals.
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
            Install PortalSnap
          </a>

          <Link
            href="/docs/portalsnap"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-card text-[var(--text-main)] hover:border-purple-400 text-sm font-medium transition"
          >
            <FileCheck2 className="w-4 h-4 text-purple-400" />
            Documentation
          </Link>
        </div>
      </section>

      {/* Key Feature Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-[var(--card-border)]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">Smart Field Mapping</h3>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              Maps unstandardized web input fields (e.g. `fname`, `first_name`, `txtCandidateGivenName`) using deep semantic heuristics.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-[var(--card-border)]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">Local Privacy Sandbox</h3>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              Confidential documents (IDs, tax forms, transcripts) are parsed client-side with zero telemetry storage on AQVONX servers.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-[var(--card-border)]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">Eligibility Rule Engine</h3>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              Pre-screens user credentials against age limits, degree requirements, and cutoffs before form submission to avoid failed fees.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/pricing/portalsnap"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl purple-glass-pill text-xs font-semibold hover:bg-purple-500/25 transition-all"
          >
            Explore PortalSnap Pro Plans (₹99/mo) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
