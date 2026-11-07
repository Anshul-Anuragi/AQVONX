import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Zap, FileSearch } from 'lucide-react';
import { AQVONXLogoMark } from '@/components/logo';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center space-y-16 pt-8 pb-20">
      {/* Top Banner Tag */}
      <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full purple-glass-pill text-xs font-medium tracking-wide">
        <div className="w-4 h-4 text-purple-300">
          <AQVONXLogoMark />
        </div>
        <span>Parent Ecosystem for High-Performance Browser Tools</span>
      </div>

      {/* Main Editorial Hero Heading */}
      <div className="max-w-4xl space-y-6">
        <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl font-normal leading-[1.08] text-[var(--text-main)]">
          Editorial tools <br /> your workflow{' '}
          <span className="italic text-[#ff7a59]">won’t outgrow.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[var(--text-muted)] font-normal leading-relaxed">
          Zero-slop AI extensions engineered for deep learners, researchers, and candidates. Universal lecture mind maps, instant exam qualification sweeps, and focused editorial research.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/extensions/notesgpt"
          className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all hover:scale-105"
        >
          Explore NotesGPT <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/pricing"
          className="px-6 py-3.5 rounded-2xl glass-card text-[var(--text-main)] font-medium text-sm hover:border-purple-400 transition-all hover:scale-105"
        >
          View All Tiers &amp; Pricing
        </Link>
      </div>

      {/* Low-Opacity Glass Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12">
        {/* Card 1 */}
        <div className="glass-card p-7 text-left space-y-4 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            NotesGPT
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Multimodal frame capture for YouTube, Udemy, and Coursera. Converts complex whiteboards into structured bilingual study notes and interactive Edraw-style mind maps.
          </p>
          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/extensions/notesgpt"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Live Demo &amp; Chrome Install →
            </Link>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">₹149/mo</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-7 text-left space-y-4 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FileSearch className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            PortalSnap
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Evaluates 60-page PSU &amp; Central Government notification PDFs against your exact degree, age, and reservation criteria in seconds.
          </p>
          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/extensions/portalsnap"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Eligibility Engine →
            </Link>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">₹99/mo</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-7 text-left space-y-4 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            Centralized Auth &amp; API Gate
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Hardware-locked JWT license verification with Neon PostgreSQL and Razorpay UPI subscriptions. Completely protected against local unpacking and bypasses.
          </p>
          <div className="pt-2">
            <Link
              href="/docs"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View Security Architecture →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
