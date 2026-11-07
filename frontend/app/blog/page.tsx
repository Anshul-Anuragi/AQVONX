import Link from 'next/link';

const POSTS = [
  {
    slug: 'edrawmind-bilateral-organic-engine',
    title: 'How we built an organic bilateral SVG mind map renderer without external libraries',
    category: 'NotesGPT',
    date: 'Oct 2026',
    summary:
      'A deep dive into cubic Bezier curve generation, canvas matrix transforms, and collapsible leaf nodes.',
  },
  {
    slug: 'bypassing-youtube-csp-safely',
    title: 'Why Manifest V3 content scripts crash on fetch() and how to tunnel AI streams via Service Workers',
    category: 'Architecture',
    date: 'Sep 2026',
    summary:
      'Understanding Chrome background message passing and model cascading fallback queues.',
  },
  {
    slug: 'serverless-daily-quota-enforcement',
    title: 'Zero-leak serverless quota gating with Neon PostgreSQL and Asyncpg',
    category: 'Backend',
    date: 'Aug 2026',
    summary:
      'Preventing reverse engineering and API exhaustion using atomic Postgres indexed counters instead of redis locks.',
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-10">
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-widest text-purple-400 purple-glass-pill px-3 py-1 rounded-full">
          Research &amp; Updates
        </span>
        <h1 className="font-editorial text-5xl sm:text-6xl text-[var(--text-main)]">
          Engineering &amp; Changelog
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Technical deep dives, feature breakdowns, and architecture notes across all AQVONX browser extensions.
        </p>
      </div>

      <div className="space-y-4">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block glass-card p-6 hover:border-purple-400 transition-all group"
          >
            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] mb-2 font-mono">
              <span className="purple-glass-pill px-2.5 py-0.5 rounded-md text-purple-300">
                {post.category}
              </span>
              <span>{post.date}</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-main)] group-hover:text-purple-400 transition-colors">
              {post.title}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              {post.summary}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

