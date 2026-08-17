"use client";

import { Search, Code2, Cpu } from "lucide-react";
import type { ChatResponse } from "@/lib/types";

export function RequestInspector({ last }: { last: ChatResponse | null }) {
  const original = last?.original_prompt ?? "";
  const optimized = last?.optimized_prompt ?? "";
  const changed = Boolean(original && optimized && original !== optimized);
  const promptTokens = last?.usage.prompt_tokens ?? 0;
  const completionTokens = last?.usage.completion_tokens ?? 0;
  const total = last?.usage.total_tokens ?? 0;
  const promptPct = total ? Math.round((promptTokens / total) * 100) : 0;
  const completionPct = total ? Math.round((completionTokens / total) * 100) : 0;

  return (
    <aside className="w-full lg:w-[500px] bg-surface-dim flex flex-col h-full border-l border-outline-variant shrink-0 z-10">
      <div className="h-14 border-b border-outline-variant bg-surface flex items-center px-6 shrink-0">
        <h3 className="text-[20px] font-bold leading-8 tracking-[-0.01em] text-on-surface flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Request Inspector
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        {!last ? (
          <p className="text-sm text-on-surface-variant">
            Send a prompt to inspect optimization, routing, tokens, and cache
            decisions for that request.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                Prompt Optimization Diff
              </h4>
              <div className="glass-panel rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-outline-variant bg-error/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-error">
                      Original Input
                    </span>
                    <span className="font-mono text-[11px] text-on-surface-variant">
                      Length: {original.length}c
                    </span>
                  </div>
                  <p
                    className={`font-mono text-[13px] text-on-surface leading-relaxed ${
                      changed ? "line-through decoration-error/50 decoration-2" : ""
                    }`}
                  >
                    {original || "—"}
                  </p>
                </div>
                <div className="p-4 bg-secondary/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-secondary">
                      {changed ? "Optimized" : "Unchanged"}
                    </span>
                    <span className="font-mono text-[11px] text-on-surface-variant">
                      Length: {optimized.length}c
                    </span>
                  </div>
                  <p className="font-mono text-[13px] text-secondary leading-relaxed">
                    {optimized || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-xl flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Detected Intent
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Code2 className="w-5 h-5 text-primary" />
                  <span className="text-base font-bold text-on-surface capitalize">
                    {last.intent || "unknown"}
                  </span>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Complexity Score
                </span>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-[24px] font-bold leading-none text-on-surface">
                    {(last.complexity_score ?? 0).toFixed(2)}
                  </span>
                  <span className="text-[13px] text-on-surface-variant mb-0.5">/ 1.0</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-secondary via-tertiary to-error rounded-full"
                    style={{ width: `${Math.round((last.complexity_score ?? 0) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                  Routing Decision
                </span>
                <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold uppercase tracking-[0.05em]">
                  {last.cache_hit ? "CACHE HIT" : last.fallback_used ? "FALLBACK" : "AUTO-ROUTED"}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-surface-container-high p-3 rounded-lg border border-outline-variant">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-outline shrink-0">
                  <Cpu className="w-5 h-5 text-on-surface" />
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface">{last.model}</div>
                  <div className="text-[13px] text-on-surface-variant">
                    {last.route_reason || "No routing note"}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex flex-col gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                Token Breakdown
              </span>
              <div>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-on-surface">Prompt Tokens</span>
                  <span className="text-on-surface-variant">
                    {promptTokens} ({promptPct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full" style={{ width: `${promptPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-on-surface">Completion Tokens</span>
                  <span className="text-on-surface-variant">
                    {completionTokens} ({completionPct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
              <div className="pt-3 border-t border-outline-variant flex justify-between items-center">
                <span className="text-[13px] text-on-surface-variant">
                  Cost / baseline
                </span>
                <span className="text-sm font-bold text-on-surface">
                  ${last.cost_usd.toFixed(6)} / ${last.baseline_cost_usd.toFixed(6)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
