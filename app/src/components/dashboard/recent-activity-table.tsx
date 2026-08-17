"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { RequestRow } from "@/lib/types";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function RecentActivityTable({ rows }: { rows: RequestRow[] }) {
  return (
    <div className="glass-panel rounded-xl flex flex-col lg:col-span-2 overflow-hidden min-h-[380px]">
      <div className="p-4 border-b border-[#1F2937] flex justify-between items-center bg-[#111827]/50">
        <h3 className="text-[24px] font-medium leading-8 tracking-[-0.01em] text-on-surface">
          Recent Activity
        </h3>
        <Link
          href="/requests"
          className="text-[13px] text-primary hover:text-primary-container transition-colors flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant p-8">
          No requests logged yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#0B0F19]/50">
                {["TIME", "PROMPT", "MODEL", "CACHE", "COST", "LATENCY"].map((h) => (
                  <th
                    key={h}
                    className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant px-4 py-2"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono text-[13px] text-on-surface">
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#1F2937]/50 table-row-hover">
                  <td className="px-4 py-2 whitespace-nowrap text-on-surface-variant">
                    {formatTime(row.created_at)}
                  </td>
                  <td className="px-4 py-2 truncate max-w-[220px]" title={row.prompt}>
                    {row.prompt}
                  </td>
                  <td className="px-4 py-2">
                    <span className="bg-surface-container-high px-2 py-1 rounded text-xs border border-[#374151]">
                      {row.model}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {row.cache_hit ? (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                        HIT
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-tertiary bg-tertiary/10 px-2 py-0.5 rounded border border-tertiary/20">
                        MISS
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">${row.cost_usd.toFixed(6)}</td>
                  <td className="px-4 py-2 text-right">{row.latency_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
