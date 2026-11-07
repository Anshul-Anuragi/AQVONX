import Link from 'next/link';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { notFound } from 'next/navigation';

const ARTICLES: Record<
  string,
  { title: string; category: string; date: string; content: string[] }
> = {
  'edrawmind-bilateral-organic-engine': {
    title:
      'How we built an organic bilateral SVG mind map renderer without external libraries',
    category: 'NotesGPT',
    date: 'Oct 2026',
    content: [
      'Rendering dynamic semantic graphs inside an MV3 browser side-panel requires extreme rendering efficiency. Bundling large charting engines like D3 or GoJS increases extension memory footprint and slows frame rates during video playback.',
      'To solve this, NotesGPT implements an organic bilateral curve generator using native cubic Bezier mathematical formulas. Branches gracefully branch out from the central idea node towards secondary concepts.',
      'Each node position is calculated using recursive bounding-box evaluations with horizontal and vertical collision avoidance. The final output is pure vector SVG string, allowing direct copy-paste into Obsidian or Figma.',
    ],
  },
  'bypassing-youtube-csp-safely': {
    title:
      'Why Manifest V3 content scripts crash on fetch() and how to tunnel AI streams via Service Workers',
    category: 'Architecture',
    date: 'Sep 2026',
    content: [
      'Chrome Manifest V3 strictly enforces Content Security Policy (CSP) headers declared by the target host website. If YouTube or Coursera prohibits external API requests from content scripts, any fetch() attempt is rejected by the browser.',
      'Our architecture routes all media analysis snapshots through chrome.runtime.sendMessage to the background service worker, which performs authenticated SSL handshakes with the AQVONX FastAPI proxy.',
      'This guarantees zero key leaks, sub-100ms message-dispatch times, and immunity from host-page script collisions.',
    ],
  },
  'serverless-daily-quota-enforcement': {
    title:
      'Zero-leak serverless quota gating with Neon PostgreSQL and Asyncpg',
    category: 'Backend',
    date: 'Aug 2026',
    content: [
      'Client-side quota checks in browser extensions can be circumvented simply by inspecting local storage or mocking responses in Chrome DevTools.',
      'AQVONX relies on serverless Neon PostgreSQL with asyncpg connection pools. Each API call carries a cryptographically signed JWT with user identification.',
      'A unique constraint on (user_id, product_id, usage_date) allows single-statement atomic incrementing and hard 402 rejection once the threshold is crossed.',
    ],
  },
};

export async function generateStaticParams() {
  return [
    { slug: 'edrawmind-bilateral-organic-engine' },
    { slug: 'bypassing-youtube-csp-safely' },
    { slug: 'serverless-daily-quota-enforcement' },
  ];
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES[slug];

  if (!article) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto py-12 space-y-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-purple-400 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Engineering Changelog
      </Link>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono">
          <span className="purple-glass-pill px-2.5 py-0.5 rounded-md text-purple-300">
            {article.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {article.date}
          </span>
        </div>

        <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--text-main)] leading-tight">
          {article.title}
        </h1>
      </div>

      <div className="glass-card p-8 sm:p-10 space-y-6 text-sm leading-relaxed text-[var(--text-muted)]">
        {article.content.map((paragraph, idx) => (
          <p key={idx} className="text-base text-[var(--text-main)]/90 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}

