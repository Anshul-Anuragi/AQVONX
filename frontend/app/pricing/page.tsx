import Link from 'next/link';
import { Check, ArrowRight, Zap, FileSearch, Newspaper } from 'lucide-react';

export default function PricingOverviewPage() {
  const products = [
    {
      id: 'notesgpt',
      name: 'NotesGPT',
      tagline: 'Multimodal whiteboard lecture capture & vector SVG mind maps.',
      price: '₹149',
      icon: Zap,
      accent: 'text-purple-400',
      badge: 'POPULAR',
      features: [
        '250 High-Speed Gemini Flash Syntheses / Day',
        'Dynamic Vector SVG Mind Maps & Flowcharts',
        'Bilingual Transcription (English & Hindi/Hinglish)',
        'Obsidian & Notion Direct Markdown Paste',
      ],
    },
    {
      id: 'portalsnap',
      name: 'PortalSnap',
      tagline: 'Instant eligibility sweeps for 60-page PSU & Govt exam PDFs.',
      price: '₹99',
      icon: FileSearch,
      accent: 'text-cyan-400',
      badge: 'FASTEST',
      features: [
        'Instant criteria parsing with cited paragraph numbers',
        'Degree, age & category eligibility verification matrix',
        'Google Calendar deadline & admit card integration',
        'Zero telemetry local privacy sandbox',
      ],
    },
    {
      id: 'editoriallens',
      name: 'EditorialLens',
      tagline: 'UPSC Mains GS-1/4 argument extractor & daily syllabus matcher.',
      price: '₹199',
      icon: Newspaper,
      accent: 'text-emerald-400',
      badge: 'IN LABS',
      features: [
        'Mains syllabus point mapping across editorials',
        'Multi-perspective pros, cons & committee citations',
        'Anki & Notion flashcard automated sync',
        'Contextual bias detection HUD in browser',
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 text-center space-y-12">
      <div className="space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-purple-400 purple-glass-pill px-3 py-1 rounded-full">
          Transparent Subscriptions
        </span>
        <h1 className="font-editorial text-5xl sm:text-6xl text-[var(--text-main)]">
          Simple pricing for <span className="italic text-[#ff7a59]">every workflow.</span>
        </h1>
        <p className="text-[var(--text-muted)] max-w-xl mx-auto text-sm sm:text-base">
          Choose standalone licenses or activate individual extensions via hardware-locked JWT tokens with UPI or card billing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {products.map((prod) => {
          const Icon = prod.icon;
          return (
            <div
              key={prod.id}
              className="glass-card p-7 flex flex-col justify-between space-y-6 relative hover:border-purple-400/60"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center ${prod.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono purple-glass-pill px-2.5 py-0.5 rounded-full">
                    {prod.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[var(--text-main)] mt-4">
                  {prod.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 min-h-[32px]">
                  {prod.tagline}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold font-mono text-[var(--text-main)]">
                    {prod.price}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">/ month</span>
                </div>

                <div className="mt-6 space-y-2.5 pt-4 border-t border-[var(--card-border)]">
                  {prod.features.map((feat, idx) => (
                    <div key={idx} className="text-xs text-[var(--text-main)] flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/pricing/${prod.id}`}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs text-center flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all"
              >
                View {prod.name} Plans <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

