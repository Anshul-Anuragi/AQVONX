import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Database, 
  Key, 
  Zap, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function DocsOverviewPage() {
  return (
    <div className="space-y-10 text-[var(--text-muted)]">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-2">
          <span>GETTING STARTED</span>
          <span>/</span>
          <span>ARCHITECTURE OVERVIEW</span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl font-normal text-[var(--text-main)] tracking-tight">
          AQVONX Developer Documentation
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
          The unified control plane and backend proxy for Chrome AI extensions. Enforces server-side rate-limits, handles JWT handshakes, and keeps your Google Gemini API keys completely hidden from client code.
        </p>
      </div>

      {/* High-Level Architecture */}
      <div className="glass-card p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          Monorepo Architecture
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          AQVONX is structured as a unified monorepo containing the Next.js 15 presentation layer, the high-throughput FastAPI backend engine, and shared TypeScript type contracts.
        </p>

        <div className="p-4 rounded-xl bg-black/40 border border-[var(--card-border)] font-mono text-xs text-[var(--text-main)] space-y-1">
          <div><strong className="text-purple-400">AQVONX/</strong></div>
          <div>├── <span className="text-[var(--text-main)] font-semibold">frontend/</span> # Next.js 15 (App Router, Tailwind CSS, Lucide)</div>
          <div>├── <span className="text-[var(--text-main)] font-semibold">backend/</span>  # FastAPI (Python 3.11+, Neon PG Asyncpg, Gemini Flash Proxy)</div>
          <div>├── <span className="text-[var(--text-main)] font-semibold">shared/</span>   # Shared TypeScript Interfaces (user, license, notes)</div>
          <div>└── <span className="text-purple-400 font-semibold">schema.sql</span># Neon PostgreSQL subscription &amp; quota migration</div>
        </div>
      </div>

      {/* Security Workflow */}
      <div id="quotas" className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Server-Side Quota Enforcement
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Browser extensions can easily be unpacked or debugged via Chrome DevTools. Storing Gemini API keys in the client or trusting client-reported usage is dangerous.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl glass-card">
            <span className="text-purple-400 font-bold block mb-1">1. Token Handshake</span>
            Extension calls <code className="text-[var(--text-main)] bg-white/10 px-1 py-0.5 rounded">POST /api/v1/auth/extension-token</code> with the user email to receive an authenticated JWT bearer token.
          </div>
          <div className="p-4 rounded-xl glass-card">
            <span className="text-indigo-400 font-bold block mb-1">2. Atomic Quota Check</span>
            Before executing inference, the backend checks <code className="text-[var(--text-main)] bg-white/10 px-1 py-0.5 rounded">daily_usage</code> table. Free tier users are capped at 5/day; Pro users receive 250/day.
          </div>
        </div>
      </div>

      {/* Setup Guide */}
      <div id="setup" className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-purple-400" />
          Quick Start: Running Local Development
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-semibold text-[var(--text-main)] mb-2">1. Backend Setup (FastAPI)</h4>
            <div className="p-4 rounded-xl bg-black/40 border border-[var(--card-border)] font-mono space-y-1">
              <div className="text-[var(--text-muted)]"># Navigate to backend and create virtual environment</div>
              <div>cd backend</div>
              <div>python3 -m venv venv &amp;&amp; source venv/bin/activate</div>
              <div>pip install -r requirements.txt</div>
              <div className="text-[var(--text-muted)] mt-2"># Copy environment template and paste your real keys</div>
              <div>cp .env.example .env</div>
              <div className="text-[var(--text-muted)] mt-2"># Start FastAPI server on port 8000</div>
              <div>uvicorn app.main:app --reload --port 8000</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text-main)] mb-2">2. Frontend Setup (Next.js 15)</h4>
            <div className="p-4 rounded-xl bg-black/40 border border-[var(--card-border)] font-mono space-y-1">
              <div className="text-[var(--text-muted)]"># Navigate to frontend and install dependencies</div>
              <div>cd frontend</div>
              <div>npm install</div>
              <div className="text-[var(--text-muted)] mt-2"># Run Next.js App Router</div>
              <div>npm run dev</div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Setup */}
      <div id="database" className="glass-card p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          Neon PostgreSQL Migration
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Run the provided <code className="text-purple-400">schema.sql</code> script directly in your Neon Console SQL Editor to instantiate the users, multi-product subscriptions, and daily usage tables.
        </p>
        <div className="text-xs">
          <a
            href="https://console.neon.tech"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg purple-glass-pill transition"
          >
            <span>Open Neon PostgreSQL Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
