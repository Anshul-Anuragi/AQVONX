import Link from 'next/link';
import { Check } from 'lucide-react';

interface PricingConfig {
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
}

const PRICING_MAP: Record<string, PricingConfig> = {
  notesgpt: {
    name: 'NotesGPT Pro',
    tagline: 'Unlimited video lecture capture, EdrawMind vector exports, and bilingual notes.',
    monthlyPrice: '₹149',
    annualPrice: '₹1,299',
    features: [
      'Unlimited 45s Auto-Sync lecture snapshots',
      'Full EdrawMind Organic Bilateral SVG & 2x PNG exports',
      'Bilingual generation: English, Hinglish, & Formal Hindi',
      'Direct sync to Obsidian (.md) with embedded frame thumbnails',
      'Universal player support: YouTube, Udemy, Coursera, & PW Live',
    ],
  },
  portalsnap: {
    name: 'PortalSnap Pro',
    tagline: 'Instant qualification sweeps for 60-page PSU & Govt exam PDFs.',
    monthlyPrice: '₹99',
    annualPrice: '₹799',
    features: [
      'Instant eligibility breakdown with cited paragraph numbers',
      'Automated syllabus weightage & negative marking matrix',
      '1-click Google Calendar sync for admit card & exam dates',
      'WhatsApp notification alerts for approaching closing dates',
    ],
  },
  editoriallens: {
    name: 'EditorialLens Pro',
    tagline: 'UPSC Mains GS-1/4 argument extractor & daily syllabus matcher.',
    monthlyPrice: '₹199',
    annualPrice: '₹1,599',
    features: [
      'Instant argument extraction from Hindu & Indian Express editorials',
      'Syllabus topic mapping across GS Paper 1 through 4',
      'Balanced counter-argument generation & committee citations',
      'Export directly to Anki flashcards & Notion Mains notebook',
    ],
  },
};

export async function generateStaticParams() {
  return [
    { extension: 'notesgpt' },
    { extension: 'portalsnap' },
    { extension: 'editoriallens' },
  ];
}

export default async function ExtensionPricingPage({
  params,
}: {
  params: Promise<{ extension: string }>;
}) {
  const { extension } = await params;
  const config = PRICING_MAP[extension] || PRICING_MAP['notesgpt'];

  return (
    <div className="max-w-4xl mx-auto py-12 text-center space-y-12">
      <div className="space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-purple-400 purple-glass-pill px-3 py-1 rounded-full">
          Upgrade License
        </span>
        <h1 className="font-editorial text-5xl sm:text-6xl text-[var(--text-main)]">
          {config.name}
        </h1>
        <p className="text-[var(--text-muted)] max-w-lg mx-auto text-sm sm:text-base">
          {config.tagline}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        {/* Free Plan */}
        <div className="glass-card p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-main)]">Free Community</h3>
            <div className="text-3xl font-bold font-mono">₹0</div>
            <p className="text-xs text-[var(--text-muted)]">Perfect for occasional learning and testing.</p>

            <div className="space-y-2.5 pt-4">
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" /> 5 AI lecture notes per day
              </div>
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" /> Standard Mermaid Mind Map preview
              </div>
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" /> Markdown text exports
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-2.5 rounded-xl border border-[var(--card-border)] text-xs font-semibold hover:border-purple-400 transition-colors"
          >
            Current Tier
          </button>
        </div>

        {/* Pro Plan */}
        <div className="glass-card p-8 flex flex-col justify-between space-y-6 border-purple-500/40 relative shadow-2xl shadow-purple-500/10">
          <div className="absolute top-4 right-4 text-[10px] font-bold font-mono tracking-wide px-2.5 py-1 rounded-full bg-purple-500 text-white">
            MOST POPULAR
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-main)]">Pro Unlimited</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono text-[var(--text-main)]">{config.monthlyPrice}</span>
              <span className="text-xs text-[var(--text-muted)]">/ month</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Billed monthly with UPI Autopay, cancel anytime.</p>

            <div className="space-y-2.5 pt-4">
              {config.features.map((feat, idx) => (
                <div key={idx} className="text-xs text-[var(--text-main)] flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/dashboard"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs text-center transition-all shadow-lg shadow-purple-600/30"
          >
            Activate License via UPI / Card →
          </Link>
        </div>
      </div>
    </div>
  );
}

