'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from './ThemeProvider';
import { Logo } from './logo';
import {
  ChevronDown,
  Sparkles,
  FileSearch,
  Newspaper,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';

const EXTENSIONS = [
  {
    id: 'notesgpt',
    name: 'NotesGPT',
    desc: 'Multimodal YouTube whiteboard lecture notes & interactive mind maps.',
    icon: Sparkles,
    href: '/extensions/notesgpt',
    pricingHref: '/pricing/notesgpt',
    docsHref: '/docs/notesgpt',
  },
  {
    id: 'portalsnap',
    name: 'PortalSnap',
    desc: 'Instant 60-page PSU & Govt exam PDF eligibility scanner.',
    icon: FileSearch,
    href: '/extensions/portalsnap',
    pricingHref: '/pricing/portalsnap',
    docsHref: '/docs/portalsnap',
  },
  {
    id: 'editoriallens',
    name: 'EditorialLens',
    desc: 'UPSC Mains GS-1/4 argument extractor & daily syllabus matcher.',
    icon: Newspaper,
    href: '/extensions/editoriallens',
    pricingHref: '/pricing/editoriallens',
    docsHref: '/docs/editoriallens',
  },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [extOpen, setExtOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      <nav className="glass-card px-5 sm:px-6 py-3 flex items-center justify-between border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xl">
        {/* Brand */}
        <Logo size="md" />

        {/* Navigation Menus */}
        <div className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-[var(--text-muted)]">
          {/* Extensions Umbrella Dropdown */}
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setExtOpen(true)}
            onMouseLeave={() => setExtOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-[var(--text-main)] transition-colors py-2">
              Extensions
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${extOpen ? 'rotate-180' : ''}`} />
            </button>

            {extOpen && (
              <div className="absolute top-full -left-8 w-72 glass-card p-2.5 flex flex-col gap-1 shadow-2xl border border-[var(--purple-glass-border)] animate-in fade-in zoom-in-95 duration-150">
                {EXTENSIONS.map((ext) => {
                  const Icon = ext.icon;
                  return (
                    <Link
                      key={ext.id}
                      href={ext.href}
                      onClick={() => setExtOpen(false)}
                      className="p-2.5 rounded-xl hover:bg-purple-500/10 flex items-start gap-3 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[var(--text-main)] flex items-center gap-1">
                          {ext.name}
                        </div>
                        <p className="text-[11.5px] text-[var(--text-muted)] line-clamp-1">
                          {ext.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing Umbrella Dropdown */}
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setPricingOpen(true)}
            onMouseLeave={() => setPricingOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-[var(--text-main)] transition-colors py-2">
              Pricing
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${pricingOpen ? 'rotate-180' : ''}`} />
            </button>

            {pricingOpen && (
              <div className="absolute top-full -left-4 w-60 glass-card p-2 flex flex-col gap-1 shadow-2xl border border-[var(--purple-glass-border)] animate-in fade-in zoom-in-95 duration-150">
                <Link
                  href="/pricing"
                  onClick={() => setPricingOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-purple-400 hover:bg-purple-500/10"
                >
                  All Products Overview →
                </Link>
                <div className="h-px bg-white/10 my-1" />
                {EXTENSIONS.map((ext) => (
                  <Link
                    key={ext.id}
                    href={ext.pricingHref}
                    onClick={() => setPricingOpen(false)}
                    className="px-3 py-2 rounded-lg text-xs hover:bg-purple-500/10 text-[var(--text-main)] flex justify-between items-center"
                  >
                    <span>{ext.name}</span>
                    <span className="text-[10px] purple-glass-pill px-2 py-0.5 rounded-full font-mono">
                      Plans
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Docs Umbrella Dropdown */}
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setDocsOpen(true)}
            onMouseLeave={() => setDocsOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-[var(--text-main)] transition-colors py-2">
              Docs
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${docsOpen ? 'rotate-180' : ''}`} />
            </button>

            {docsOpen && (
              <div className="absolute top-full -left-4 w-60 glass-card p-2 flex flex-col gap-1 shadow-2xl border border-[var(--purple-glass-border)] animate-in fade-in zoom-in-95 duration-150">
                <Link
                  href="/docs"
                  onClick={() => setDocsOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-purple-400 hover:bg-purple-500/10"
                >
                  Documentation Hub →
                </Link>
                <div className="h-px bg-white/10 my-1" />
                {EXTENSIONS.map((ext) => (
                  <Link
                    key={ext.id}
                    href={ext.docsHref}
                    onClick={() => setDocsOpen(false)}
                    className="px-3 py-2 rounded-lg text-xs hover:bg-purple-500/10 text-[var(--text-main)]"
                  >
                    {ext.name} Manual
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Blog */}
          <Link href="/blog" className="hover:text-[var(--text-main)] transition-colors">
            Blog
          </Link>
        </div>

        {/* Right Tools: Dark/Light Mode + Auth State */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--card-border)] hover:border-purple-400 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title="Toggle Black / White Theme"
            type="button"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-800" />
            )}
          </button>

          {/* Dynamic Sign In vs. User Profile Dropdown */}
          {status === 'loading' ? (
            <div className="w-20 h-8 rounded-xl bg-white/5 animate-pulse" />
          ) : session?.user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-xs font-semibold text-[var(--text-main)] hover:bg-purple-500/20 transition-all"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="Avatar" className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {session.user.name?.[0] || session.user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="truncate max-w-[100px]">
                  {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
              </button>

              {profileOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-56 glass-card p-2 flex flex-col gap-1 shadow-2xl border border-[var(--purple-glass-border)] animate-in fade-in zoom-in-95 duration-150 z-50"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/10 text-[11px]">
                    <div className="font-semibold text-[var(--text-main)] truncate">
                      {session.user.name || 'AQVONX Member'}
                    </div>
                    <div className="text-[var(--text-muted)] truncate text-[10px]">
                      {session.user.email}
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setProfileOpen(false)}
                    className="px-3 py-2 rounded-lg text-xs hover:bg-purple-500/10 text-[var(--text-main)] flex items-center gap-2 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                    My Licenses &amp; Quotas
                  </Link>

                  {/* Admin link visible ONLY if user is verified as Admin */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="px-3 py-2 rounded-lg text-xs hover:bg-purple-500/10 text-emerald-400 flex items-center gap-2 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Admin Console
                    </Link>
                  )}

                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 mt-1 border-t border-white/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl purple-glass-pill hover:bg-purple-500/25 transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
