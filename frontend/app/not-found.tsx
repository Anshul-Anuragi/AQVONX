import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
      {/* 404 Status Header */}
      <span className="font-mono text-purple-400 text-sm tracking-widest uppercase mb-3">
        404 ERROR
      </span>

      {/* Main Heading */}
      <h1 className="font-editorial text-5xl sm:text-7xl text-[var(--text-main)] tracking-tight mb-4">
        Sorry, we can’t find <br />
        that page.
      </h1>

      {/* Subtitle */}
      <p className="text-[var(--text-muted)] text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-8">
        The page you’re looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      {/* Action Button */}
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-purple-600/30"
      >
        Return to Home
      </Link>
    </div>
  );
}

