import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Newspaper, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export async function generateStaticParams() {
  return [
    { extension: 'notesgpt' },
    { extension: 'portalsnap' },
    { extension: 'editoriallens' },
  ];
}

export default async function ExtensionPage({
  params,
}: {
  params: Promise<{ extension: string }>;
}) {
  const { extension } = await params;

  if (extension === 'notesgpt') {
    redirect('/notesgpt');
  }

  if (extension === 'portalsnap') {
    redirect('/portalsnap');
  }

  // EditorialLens Showcase
  return (
    <div className="max-w-4xl mx-auto py-16 text-center space-y-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-purple-400 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Studio Home
      </Link>

      <div className="space-y-4">
        <span className="purple-glass-pill text-xs font-mono px-3 py-1 rounded-full uppercase tracking-wider">
          Early Labs Preview
        </span>
        <h1 className="font-editorial text-5xl sm:text-6xl text-[var(--text-main)]">
          EditorialLens <span className="italic text-[#ff7a59]">HUD</span>
        </h1>
        <p className="text-base text-[var(--text-muted)] max-w-xl mx-auto">
          UPSC Mains GS-1 through 4 argument extractor, balanced editorial counter-points, and committee citation matcher.
        </p>
      </div>

      <div className="glass-card p-8 sm:p-12 text-left max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">Private Alpha Access</h3>
            <p className="text-xs text-[var(--text-muted)]">Releasing Q2 2026 for Pro license holders.</p>
          </div>
        </div>

        <ul className="space-y-3 text-sm text-[var(--text-muted)]">
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>Side-by-side claim verification directly in Indian Express &amp; The Hindu tabs.</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>Automatic extraction of Supreme Court rulings, 2nd ARC recommendations, and Law Commission reports.</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>One-click Anki spaced repetition export for revision.</span>
          </li>
        </ul>

        <div className="pt-4 flex gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2"
          >
            Join Priority Queue in Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

