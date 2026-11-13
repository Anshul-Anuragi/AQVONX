import React from "react";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Zap, Sparkles, ArrowLeft, BookOpen, Layers } from "lucide-react";

interface PageProps {
  params: Promise<{
    extension: string;
  }>;
}

export async function generateStaticParams() {
  return [
    { extension: "notesgpt" },
    { extension: "portalsnap" },
    { extension: "editoriallens" },
    { extension: "bidsniper" },
  ];
}

export default async function ExtensionDocPage({ params }: PageProps) {
  const { extension } = await params;
  const filePath = path.join(process.cwd(), "content/docs", `${extension}.mdx`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");

  // Basic frontmatter extraction
  let title = extension === "notesgpt" ? "NotesGPT Documentation" : "PortalSnap Documentation";
  let content = rawContent;
  if (rawContent.startsWith("---")) {
    const parts = rawContent.split("---");
    if (parts.length >= 3) {
      content = parts.slice(2).join("---").trim();
      const metaLines = parts[1].split("\n");
      for (const line of metaLines) {
        if (line.startsWith("title:")) {
          title = line.replace("title:", "").trim();
        }
      }
    }
  }

  const isNotes = extension === "notesgpt";

  return (
    <div className="space-y-8 text-[var(--text-muted)]">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
        <Link href="/docs" className="hover:text-purple-400 transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Docs Overview
        </Link>
        <span>/</span>
        <span className="text-purple-400 uppercase">{extension}</span>
      </div>

      {/* Header Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/15 text-purple-400 border border-purple-500/30">
          {isNotes ? <Zap className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        </div>
        <div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-normal text-[var(--text-main)]">{title}</h1>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
            PRODUCT ID: <span className="text-purple-400 font-semibold">{extension}</span> • PRODUCTION READY
          </p>
        </div>
      </div>

      {/* Rendered Guide Body */}
      <div className="glass-card p-6 sm:p-8 space-y-6 leading-relaxed">
        <div className="prose prose-invert max-w-none text-[var(--text-main)]">
          {content.split("\n\n").map((block, idx) => {
            const trimmed = block.trim();

            if (trimmed.startsWith("# ")) {
              return (
                <h1 key={idx} className="font-editorial text-3xl font-normal text-[var(--text-main)] mt-6 mb-2">
                  {trimmed.replace("# ", "")}
                </h1>
              );
            }
            if (trimmed.startsWith("## ")) {
              return (
                <h2 key={idx} className="text-xl font-semibold text-[var(--text-main)] mt-8 mb-3 pb-2 border-b border-[var(--card-border)]">
                  {trimmed.replace("## ", "")}
                </h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3 key={idx} className="text-base font-semibold text-purple-400 mt-4 mb-2">
                  {trimmed.replace("### ", "")}
                </h3>
              );
            }
            if (trimmed.startsWith("```")) {
              const lines = trimmed.split("\n");
              const lang = lines[0].replace("```", "").trim();
              const code = lines.slice(1, -1).join("\n");
              return (
                <div key={idx} className="my-4 rounded-xl overflow-hidden border border-[var(--card-border)] bg-black/40">
                  {lang && (
                    <div className="px-4 py-1.5 bg-white/5 border-b border-[var(--card-border)] text-[10px] font-mono text-[var(--text-muted)] uppercase">
                      {lang}
                    </div>
                  )}
                  <pre className="p-4 font-mono text-xs text-purple-300 overflow-x-auto whitespace-pre">
                    <code>{code}</code>
                  </pre>
                </div>
              );
            }
            if (trimmed.startsWith("|")) {
              const rows = trimmed.split("\n").map(r => r.split("|").filter((_, i, arr) => i !== 0 && i !== arr.length - 1).map(c => c.trim()));
              const headers = rows[0];
              const bodyRows = rows.slice(2);
              return (
                <div key={idx} className="overflow-x-auto my-4 border border-[var(--card-border)] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-white/5 text-[var(--text-main)]">
                      <tr>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-3 border-b border-[var(--card-border)] font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {bodyRows.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/[0.02]">
                          {r.map((c, cIdx) => (
                            <td key={cIdx} className="p-3 text-[var(--text-muted)] font-mono text-[11px]">{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            if (trimmed.startsWith("- ")) {
              const items = trimmed.split("\n- ").map(i => i.replace(/^- /, ""));
              return (
                <ul key={idx} className="list-disc pl-5 space-y-1 text-xs text-[var(--text-muted)] my-2">
                  {items.map((it, iIdx) => (
                    <li key={iIdx}>{it}</li>
                  ))}
                </ul>
              );
            }
            if (trimmed.startsWith("---")) {
              return <hr key={idx} className="border-[var(--card-border)] my-6" />;
            }

            return (
              <p key={idx} className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                {trimmed}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

