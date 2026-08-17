"use client";

import { useEffect, useState } from "react";
import { fetchRequests, fetchRouter } from "@/lib/api";
import type { RequestRow, RouterInfo } from "@/lib/types";

export default function ModelsAndRoutingPage() {
  const [info, setInfo] = useState<RouterInfo | null>(null);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchRouter(), fetchRequests({ limit: 25 })])
      .then(([router, reqs]) => {
        setInfo(router);
        setRows(reqs.items);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[32px] font-semibold tracking-tight text-on-surface leading-10">
          Routing Rules
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Heuristic router. Decisions are logged so a later model can train on outcomes.
        </p>
      </div>

      {error && (
        <div className="glass-panel rounded-xl p-4 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Simple model
          </div>
          <div className="text-xl font-semibold text-on-surface mt-2">
            {info?.simple_model ?? "—"}
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Complex model
          </div>
          <div className="text-xl font-semibold text-on-surface mt-2">
            {info?.complex_model ?? "—"}
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            Complexity threshold
          </div>
          <div className="text-xl font-semibold text-on-surface mt-2">
            {info ? info.complexity_threshold.toFixed(2) : "—"}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-lg font-semibold text-on-surface mb-3">Active rules</h3>
        <ul className="list-disc pl-5 text-sm text-on-surface-variant space-y-2">
          {(info?.rules ?? []).map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1F2937]">
          <h3 className="text-lg font-semibold text-on-surface">Recent decisions</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1F2937] bg-[#0B0F19]/50">
              {["Prompt", "Intent", "Score", "Model", "Reason"].map((h) => (
                <th
                  key={h}
                  className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">
                  No routing decisions logged yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-[#1F2937]/50">
                  <td className="px-4 py-3 truncate max-w-[240px] text-on-surface">
                    {row.prompt}
                  </td>
                  <td className="px-4 py-3 capitalize text-on-surface-variant">
                    {row.intent || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {row.complexity_score != null
                      ? row.complexity_score.toFixed(2)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px]">{row.model}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {row.route_reason || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
