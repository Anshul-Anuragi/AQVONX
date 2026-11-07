"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  Zap, 
  Sparkles, 
  Code, 
  CreditCard, 
  Search, 
  ChevronRight,
  ExternalLink,
  Menu,
  X
} from "lucide-react";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navCategories = [
    {
      title: "Getting Started",
      items: [
        { label: "Overview & Architecture", href: "/docs" },
        { label: "Chrome Extension Setup", href: "/docs#setup" },
        { label: "Neon PG Database Setup", href: "/docs#database" },
      ],
    },
    {
      title: "Extensions",
      items: [
        { label: "NotesGPT Guide", href: "/docs/notesgpt", badge: "v2.4" },
        { label: "NotesGPT Flowchart SVG", href: "/docs/notesgpt#mindmap" },
        { label: "PortalSnap Guide", href: "/docs/portalsnap", badge: "v1.8" },
        { label: "PortalSnap Eligibility Rules", href: "/docs/portalsnap#rules" },
      ],
    },
    {
      title: "API & Server Gateway",
      items: [
        { label: "License Verification API", href: "/docs#license-api" },
        { label: "Notes Generation Proxy", href: "/docs#notes-api" },
        { label: "Server-Side Quotas", href: "/docs#quotas" },
      ],
    },
    {
      title: "Billing & Accounts",
      items: [
        { label: "Razorpay & LemonSqueezy", href: "/docs#billing" },
        { label: "Managing Pro Licenses", href: "/dashboard" },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 relative min-h-[calc(100vh-140px)]">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 p-3 rounded-full bg-purple-600 text-white shadow-xl"
        aria-label="Toggle docs navigation"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
      </button>

      {/* Sticky Collapsible Sidebar */}
      <aside
        className={`fixed md:sticky top-20 inset-y-0 left-0 z-40 md:z-0 w-72 shrink-0 glass-card md:bg-transparent rounded-2xl p-5 md:p-0 border md:border-0 border-[var(--card-border)] overflow-y-auto max-h-[calc(100vh-100px)] transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0 bg-[var(--bg-main)]" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-[var(--card-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-400 transition"
          />
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {navCategories.map((cat, idx) => (
            <div key={idx}>
              <h5 className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2 font-semibold">
                {cat.title}
              </h5>
              <ul className="space-y-1">
                {cat.items.map((item, itemIdx) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={itemIdx}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                          isActive
                            ? "bg-purple-500/15 text-purple-400 font-semibold border-l-2 border-purple-400"
                            : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5"
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted)]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Backend Swagger Link */}
        <div className="mt-8 pt-4 border-t border-[var(--card-border)] text-xs">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition"
          >
            <span>Interactive OpenAPI Swagger</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Docs Content Body */}
      <main className="flex-1 min-w-0 max-w-4xl py-2">{children}</main>
    </div>
  );
}

