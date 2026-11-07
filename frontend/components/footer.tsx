import React from "react";
import Link from "next/link";
import { ShieldCheck, Cpu, Database } from "lucide-react";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--bg-main)]/60 text-[var(--text-muted)] py-12 px-4 sm:px-6 lg:px-8 mt-20 transition-colors">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand statement */}
        <div className="space-y-4 md:col-span-1">
          <Logo size="sm" />
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            AQVONX is the centralized intelligence hub &amp; backend infrastructure for Next-Gen browser extensions, powering Gemini Flash multimodal synthesis, token-gated licensing, and secure API gateways.
          </p>
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono">
            <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-purple-400" /> Python 3.11+</span>
            <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-indigo-400" /> Neon PG</span>
          </div>
        </div>

        {/* Extensions */}
        <div>
          <h4 className="text-xs font-semibold tracking-wider uppercase text-[var(--text-main)] mb-3">Extensions</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/extensions/notesgpt" className="hover:text-purple-400 transition">NotesGPT Studio</Link></li>
            <li><Link href="/extensions/portalsnap" className="hover:text-purple-400 transition">PortalSnap Pro</Link></li>
            <li><Link href="/extensions/editoriallens" className="hover:text-purple-400 transition">EditorialLens HUD</Link></li>
            <li><Link href="/dashboard" className="hover:text-purple-400 transition">License Console</Link></li>
          </ul>
        </div>

        {/* Developers */}
        <div>
          <h4 className="text-xs font-semibold tracking-wider uppercase text-[var(--text-main)] mb-3">Developers &amp; Docs</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/docs" className="hover:text-purple-400 transition">Quick Start Guide</Link></li>
            <li><Link href="/docs/notesgpt" className="hover:text-purple-400 transition">NotesGPT Manual</Link></li>
            <li><Link href="/docs/portalsnap" className="hover:text-purple-400 transition">PortalSnap Manual</Link></li>
            <li><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition">FastAPI Swagger Specs ↗</a></li>
          </ul>
        </div>

        {/* Infrastructure & Security */}
        <div>
          <h4 className="text-xs font-semibold tracking-wider uppercase text-[var(--text-main)] mb-3">Enterprise Security</h4>
          <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
            Client Chrome extensions never expose Gemini API secrets. Every request is verified via JWT and throttled per Neon PostgreSQL daily quotas.
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl purple-glass-pill text-[11px] text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            AES-256 &amp; AsyncPG Secure
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)]">
        <p>© {new Date().getFullYear()} AQVONX Studio. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 font-mono">Status: All Systems Operational (v1.0.0)</p>
      </div>
    </footer>
  );
}
export default Footer;
