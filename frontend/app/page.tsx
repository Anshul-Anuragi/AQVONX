import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-12">
        {/* Card 1: NotesGPT */}
        <div className="glass-card p-7 text-left space-y-4 relative overflow-hidden group">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
              NotesGPT
            </h3>
            <span
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #10b981)',
                color: '#ffffff',
              }}
              className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full uppercase shadow-sm inline-flex items-center"
            >
              PRO
            </span>
          </div>
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
            <span className="text-[11px] font-mono text-[var(--text-muted)]">$6.99/mo</span>
          </div>
        </div>

        {/* Card 2: PortalSnap */}
        <div className="glass-card p-7 text-left space-y-4 relative overflow-hidden group">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
              PortalSnap
            </h3>
            <span
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #10b981)',
                color: '#ffffff',
              }}
              className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full uppercase shadow-sm inline-flex items-center"
            >
              PRO
            </span>
          </div>
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
            <span className="text-[11px] font-mono text-[var(--text-muted)]">$4.99/mo</span>
          </div>
        </div>

        {/* Card 3: EditorialLens */}
        <div className="glass-card p-7 text-left space-y-4 relative overflow-hidden group">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
              EditorialLens
            </h3>
            <span
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #10b981)',
                color: '#ffffff',
              }}
              className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full uppercase shadow-sm inline-flex items-center"
            >
              PRO
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            UPSC CSE, State PSC &amp; RBI Grade B newspaper editorial synthesizer. Generates 250-word Mains blueprints, real Supreme Court case laws, and Prelims trap questions.
          </p>
          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/extensions/editoriallens"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Editorial Synthesizer →
            </Link>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">$8.99/mo</span>
          </div>
        </div>

        {/* Card 4: BidSniper */}
        <div className="glass-card p-7 text-left space-y-4 relative overflow-hidden group">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
              BidSniper
            </h3>
            <span
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #10b981)',
                color: '#ffffff',
              }}
              className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full uppercase shadow-sm inline-flex items-center"
            >
              PRO
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Upwork &amp; Fiverr proposal co-pilot. Extracts hidden client names from past reviews, scores deal health, and writes 150-word anti-AI proposals.
          </p>
          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/pricing/bidsniper"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Proposal Architect →
            </Link>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">$19.00/mo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
