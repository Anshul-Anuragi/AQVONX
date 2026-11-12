"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  CreditCard, 
  Sparkles, 
  FileSearch, 
  Newspaper, 
  Ban, 
  Search, 
  SlidersHorizontal,
  ShieldCheck,
  Layers,
  Activity,
  Cpu,
  RefreshCw
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
  extension: string;
  plan: string;
  daily_usage: string;
  notes_count: number;
  status: "active" | "banned";
  created_at?: string;
}

interface AdminMetrics {
  totalUsers: number;
  activeSubscribers: number;
  basicCount: number;
  proCount: number;
  todayCalls: number;
  bannedCount: number;
  mrr: string;
}

export default function MasterAdminView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    activeSubscribers: 0,
    basicCount: 0,
    proCount: 0,
    todayCalls: 0,
    bannedCount: 0,
    mrr: "$0.00",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data.users) setUsers(data.users);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to load admin directory", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBan = async (id: string) => {
    setIsUpdatingId(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, action: "toggle_ban" }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, status: u.status === "banned" ? "active" : "banned" }
              : u
          )
        );
      }
    } catch (err) {
      console.error("Error updating user status:", err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.extension.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.plan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
              Management Console
            </span>
            <span className="text-[11px] font-mono text-purple-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              Master Admin
            </span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[var(--text-main)] mt-1 font-normal">
            Master Fleet Administration
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Signed in as <span className="text-[var(--text-main)] font-mono">developer@aqvonx.com</span>
          </p>
        </div>

        {/* View Switcher: Quick jump to Client View */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl border border-[var(--card-border)] bg-black/40 text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-xl border border-[var(--card-border)] bg-black/40 text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            Client View
          </Link>
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/30">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Admin Control
          </div>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="glass-card p-5 space-y-1">
          <div className="flex justify-between items-center text-[10.5px] font-mono text-[var(--text-muted)] uppercase">
            <span>Platform Revenue (MRR)</span>
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{metrics.mrr}</div>
          <div className="text-[11px] text-emerald-400/80 flex items-center gap-1 font-mono pt-1">
            <TrendingUp className="w-3 h-3" /> Live recurring revenue
          </div>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex justify-between items-center text-[10.5px] font-mono text-[var(--text-muted)] uppercase">
            <span>Active Subscriptions</span>
            <Users className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {metrics.activeSubscribers} {metrics.activeSubscribers === 1 ? "License" : "Licenses"}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono pt-1">
            {metrics.basicCount} Basic ($6.99/mo) &middot; {metrics.proCount} Pro ($14.99/3mo)
          </div>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex justify-between items-center text-[10.5px] font-mono text-[var(--text-muted)] uppercase">
            <span>Daily Quota Consumption</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {metrics.todayCalls} {metrics.todayCalls === 1 ? "Call" : "Calls"}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono pt-1">
            Live requests processed today
          </div>
        </div>

        <div className="glass-card p-5 space-y-1">
          <div className="flex justify-between items-center text-[10.5px] font-mono text-[var(--text-muted)] uppercase">
            <span>Security &amp; Suspensions</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {metrics.bannedCount} Banned
          </div>
          <div className="text-[11px] text-rose-400/80 flex items-center gap-1 font-mono pt-1">
            <ShieldAlert className="w-3 h-3" /> Blocked access status
          </div>
        </div>
      </div>

      {/* Extension Fleet Telemetry */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Extension Fleet Telemetry
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-mono">3 Products Registered</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* NotesGPT Telemetry */}
          <div className="glass-card p-5 space-y-3 border-purple-500/30">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> NotesGPT Studio
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Live
              </span>
            </div>
            <div className="text-xs space-y-1.5 font-mono text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>Active Accounts:</span>
                <span className="text-[var(--text-main)] font-semibold">{metrics.totalUsers} users</span>
              </div>
              <div className="flex justify-between">
                <span>Notes Generated Today:</span>
                <span className="text-[var(--text-main)] font-semibold">{metrics.todayCalls} notes</span>
              </div>
              <div className="flex justify-between">
                <span>Database Sync:</span>
                <span className="text-emerald-400 font-semibold">Neon PostgreSQL</span>
              </div>
            </div>
          </div>

          {/* PortalSnap Telemetry */}
          <div className="glass-card p-5 space-y-3 border-cyan-500/30">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <FileSearch className="w-3.5 h-3.5 text-cyan-400" /> PortalSnap Pro
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Ready
              </span>
            </div>
            <div className="text-xs space-y-1.5 font-mono text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>Target Fleet:</span>
                <span className="text-[var(--text-main)] font-semibold">Document Captures</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Pipeline:</span>
                <span className="text-cyan-400 font-semibold">Configured</span>
              </div>
              <div className="flex justify-between">
                <span>Engine Version:</span>
                <span className="text-[var(--text-muted)] font-semibold">v1.0.0</span>
              </div>
            </div>
          </div>

          {/* EditorialLens Telemetry */}
          <div className="glass-card p-5 space-y-3 opacity-85">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <Newspaper className="w-3.5 h-3.5 text-emerald-400" /> EditorialLens
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Beta
              </span>
            </div>
            <div className="text-xs space-y-1.5 font-mono text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>Target Fleet:</span>
                <span className="text-[var(--text-main)] font-semibold">Article &amp; Essay Analysis</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-purple-300 font-semibold">Scheduled</span>
              </div>
              <div className="flex justify-between">
                <span>Engine Version:</span>
                <span className="text-[var(--text-muted)] font-semibold">v1.0.0-rc</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live User Directory & Controls Table */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Live User Directory &amp; Security Controls
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Directly inspect active database accounts, manage subscriptions, and toggle access.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Filter users or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/50 border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
              <p className="text-xs font-mono text-[var(--text-muted)]">Connecting to Neon PostgreSQL...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-[var(--text-main)]">No end users registered yet</p>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Real accounts will populate here automatically upon sign up in the database.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-muted)] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-4">Extension</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Daily Mins / Quota</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] font-sans">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--text-main)] font-mono">
                      {u.email}
                      {u.fullName ? <span className="block text-[10px] text-[var(--text-muted)] font-sans">{u.fullName}</span> : null}
                    </td>
                    <td className="py-3 px-4 text-purple-300 font-mono text-[11px]">{u.extension}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[9.5px] font-bold ${
                          u.plan === "pro_quarterly"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : u.plan === "basic_monthly"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-white/10 text-[var(--text-muted)] border border-white/10"
                        }`}
                      >
                        {u.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-muted)] font-mono text-[11px]">{u.daily_usage}</td>
                    <td className="py-3 px-4">
                      {u.status === "active" ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Banned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 font-mono">
                      <button
                        onClick={() => toggleBan(u.id)}
                        disabled={isUpdatingId === u.id}
                        className={`font-semibold text-[11px] px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                          u.status === "banned"
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                        }`}
                      >
                        {isUpdatingId === u.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Ban className="w-3 h-3" />
                        )}
                        {u.status === "banned" ? "Unban" : "Ban Account"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
