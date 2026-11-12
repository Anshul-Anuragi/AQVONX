import Link from 'next/link';
import { Check, ArrowRight, Zap, Sparkles, ShieldCheck, Clock } from 'lucide-react';

interface ExtensionTier {
  name: string;
  price: string;
  period: string;
  subtitle: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  ctaHref: string;
}

interface ExtensionDetailPricing {
  id: string;
  name: string;
  tagline: string;
  freeTier: ExtensionTier;
  basicTier: ExtensionTier;
  proTier: ExtensionTier;
}

const EXTENSION_PRICING: Record<string, ExtensionDetailPricing> = {
  notesgpt: {
    id: 'notesgpt',
    name: 'NotesGPT Studio',
    tagline: 'Multimodal video lecture capture, bilateral vector mind maps, and bilingual synthesis.',
    freeTier: {
      name: '3-Day Free Trial',
      price: '$0',
      period: 'for 3 days',
      subtitle: '20 minutes/day active playback enabled',
      features: [
        '5 AI lecture notes syntheses per day',
        '20 minutes of active video window analysis',
        'Standard interactive SVG Mind Map preview',
        'Direct Markdown export to clipboard',
        'Bilingual English & Hinglish transcription',
      ],
      ctaText: 'Start Free Trial',
      ctaHref: '/dashboard',
    },
    basicTier: {
      name: 'Basic Monthly',
      price: '$6.99',
      period: '/ month',
      subtitle: 'Billed monthly with UPI or Card, cancel anytime',
      features: [
        'Standard continuous lecture processing',
        '60 minutes of active video transcription daily',
        'High-resolution SVG flowchart diagrams',
        'Direct Obsidian (.md) & Notion exports',
        'Priority Gemini Flash inference pipeline',
        'Hardware-locked JWT license sync',
      ],
      ctaText: 'Activate Basic ($6.99/mo)',
      ctaHref: '/dashboard',
    },
    proTier: {
      name: 'Pro 3-Month',
      price: '$14.99',
      period: '/ 3 months (~$4.99/mo)',
      subtitle: 'Most popular · Save 30% with quarterly access',
      isPopular: true,
      features: [
        'Unlimited 240+ minutes of daily video notes',
        '250 high-speed Flash multimodal requests',
        'Instant Bilateral Vector SVG Mind Map generation',
        'Embedded frame whiteboard snapshots & timestamps',
        'Universal support: YouTube, Udemy, Coursera, PW Live',
        'Sub-second inference priority queue',
      ],
      ctaText: 'Activate Pro ($14.99 / 3mo)',
      ctaHref: '/dashboard',
    },
  },
  portalsnap: {
    id: 'portalsnap',
    name: 'PortalSnap Pro',
    tagline: 'Instant 60-page PSU & Govt exam PDF qualification sweeps with cited paragraph numbers.',
    freeTier: {
      name: 'Free Community',
      price: '$0',
      period: 'forever',
      subtitle: '10 notification documents per month',
      features: [
        'Instant 60-page PDF criteria parsing',
        'Basic eligibility check with paragraph citation',
        'Local browser sandbox with zero telemetry',
      ],
      ctaText: 'Use Free Community',
      ctaHref: '/dashboard',
    },
    basicTier: {
      name: 'Basic Monthly',
      price: '$4.99',
      period: '/ month',
      subtitle: 'Billed monthly with UPI or Card',
      features: [
        '50 full notification PDF sweeps per month',
        'Automated age, category & relaxation matrix',
        '1-click Google Calendar deadline integration',
        'Negative marking and syllabus weightage chart',
      ],
      ctaText: 'Activate Basic ($4.99/mo)',
      ctaHref: '/dashboard',
    },
    proTier: {
      name: 'Pro 3-Month',
      price: '$11.99',
      period: '/ 3 months (~$3.99/mo)',
      subtitle: 'Best value · For active competitive aspirants',
      isPopular: true,
      features: [
        'Unlimited monthly PDF eligibility sweeps',
        'Detailed multi-post reservation category matrix',
        'Instant admit card & exam date alerts via WhatsApp',
        'Direct document export to Google Drive and PDF',
        'Priority PDF parsing queue (0.8s avg speed)',
      ],
      ctaText: 'Activate Pro ($11.99 / 3mo)',
      ctaHref: '/dashboard',
    },
  },
  editoriallens: {
    id: 'editoriallens',
    name: 'EditorialLens',
    tagline: 'UPSC Mains GS-1/4 editorial argument extractor & daily syllabus point matcher.',
    freeTier: {
      name: 'Early Labs Preview',
      price: '$0',
      period: 'waitlist queue',
      subtitle: 'Queue position allocated upon sign up',
      features: [
        '5 daily editorial argument maps',
        'Core GS Paper 1-4 syllabus topic matching',
        'Standard pros & cons extraction',
      ],
      ctaText: 'Join Labs Waitlist',
      ctaHref: '/dashboard',
    },
    basicTier: {
      name: 'Basic Monthly',
      price: '$8.99',
      period: '/ month',
      subtitle: 'Billed monthly for serious UPSC candidates',
      features: [
        'Unlimited Hindu & Indian Express editorial breakdowns',
        'Balanced multi-perspective committee & legal citations',
        'Automated Anki & Notion flashcard continuous sync',
        'Contextual bias detection HUD for research essays',
      ],
      ctaText: 'Activate Basic ($8.99/mo)',
      ctaHref: '/dashboard',
    },
    proTier: {
      name: 'Pro 3-Month',
      price: '$19.99',
      period: '/ 3 months (~$6.66/mo)',
      subtitle: 'Quarterly access for intensive Mains preparation',
      isPopular: true,
      features: [
        'All Basic features with zero daily rate limits',
        'Comprehensive 12-month editorial archive search',
        'Pre-formatted GS Paper 1, 2, 3 & 4 Mains answer outlines',
        'Priority access to all upcoming experimental models',
      ],
      ctaText: 'Activate Pro ($19.99 / 3mo)',
      ctaHref: '/dashboard',
    },
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
  const config = EXTENSION_PRICING[extension] || EXTENSION_PRICING['notesgpt'];

  const tiers = [config.freeTier, config.basicTier, config.proTier];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 text-center space-y-12">
      <div className="space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-purple-400 purple-glass-pill px-3 py-1 rounded-full">
          Extension Plans &amp; Quotas
        </span>
        <h1 className="font-editorial text-4xl sm:text-6xl text-[var(--text-main)] font-normal">
          {config.name}
        </h1>
        <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
          {config.tagline}
        </p>
      </div>

      {/* 3 Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className={`glass-card p-7 flex flex-col justify-between space-y-6 relative transition-all duration-200 ${
              tier.isPopular
                ? 'border-purple-500/50 shadow-xl shadow-purple-500/10'
                : 'border-[var(--card-border)] hover:border-purple-500/30'
            }`}
          >
            {tier.isPopular && (
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold font-mono tracking-wider shadow">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[var(--text-main)]">{tier.name}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{tier.subtitle}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold font-mono text-[var(--text-main)]">
                  {tier.price}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">{tier.period}</span>
              </div>

              <div className="space-y-2.5 pt-6 mt-6 border-t border-[var(--card-border)]">
                {tier.features.map((feat, fIdx) => (
                  <div key={fIdx} className="text-xs text-[var(--text-main)] flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--card-border)]">
              <Link
                href={tier.ctaHref}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs text-center flex items-center justify-center gap-1.5 transition-all ${
                  tier.isPopular
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 hover:scale-[1.01]'
                    : 'border border-[var(--card-border)] hover:border-purple-400 text-[var(--text-main)] bg-white/5'
                }`}
              >
                <span>{tier.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Back to Overview */}
      <div className="pt-6">
        <Link
          href="/pricing"
          className="text-xs text-[var(--text-muted)] hover:text-purple-300 font-mono inline-flex items-center gap-1 transition-colors"
        >
          ← View all extensions in the AQVONX fleet
        </Link>
      </div>
    </div>
  );
}
