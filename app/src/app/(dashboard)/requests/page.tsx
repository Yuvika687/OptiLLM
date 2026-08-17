"use client";

import { useEffect, useState } from "react";
import { fetchRequests } from "@/lib/api";
import type { RequestRow } from "@/lib/types";

export default function RequestsPage() {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [cacheFilter, setCacheFilter] = useState<"all" | "hit" | "miss">("all");
  const [selected, setSelected] = useState<RequestRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cache_hit =
      cacheFilter === "all" ? undefined : cacheFilter === "hit";
    fetchRequests({ limit: 100, cache_hit })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );
  }, [cacheFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-semibold tracking-tight text-on-surface leading-10">
            Request Logs
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {total} request{total === 1 ? "" : "s"} stored in Postgres.
          </p>
        </div>
        <div className="flex gap-2">
          {(["all", "hit", "miss"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setCacheFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-[13px] border ${
                cacheFilter === value
                  ? "border-primary text-primary bg-primary/10"
                  : "border-outline-variant text-on-surface-variant"
              }`}
            >
              {value === "all" ? "All" : value === "hit" ? "Cache hits" : "Cache misses"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="glass-panel rounded-xl p-4 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#0B0F19]/50">
                  {["Time", "Prompt", "Model", "Intent", "Cache", "Cost", "Latency"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant px-4 py-3"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-on-surface-variant">
                      No requests yet. Use the Playground to send one.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className="border-b border-[#1F2937]/50 table-row-hover cursor-pointer"
                    >
                      <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-on-surface truncate max-w-[240px]">
                        {row.prompt}
                      </td>
                      <td className="px-4 py-3 text-on-surface">{row.model}</td>
                      <td className="px-4 py-3 capitalize text-on-surface-variant">
                        {row.intent || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            row.cache_hit
                              ? "text-secondary"
                              : "text-tertiary"
                          }
                        >
                          {row.cache_hit ? "HIT" : "MISS"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface">
                        ${row.cost_usd.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-on-surface">{row.latency_ms}ms</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 min-h-[320px]">
          <h3 className="text-lg font-semibold text-on-surface mb-3">Detail</h3>
          {!selected ? (
            <p className="text-sm text-on-surface-variant">
              Click a row to inspect the full prompt, response, and routing
              fields used for adaptive routing later.
            </p>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <Field label="Route" value={selected.route_reason || "—"} />
              <Field
                label="Complexity"
                value={
                  selected.complexity_score != null
                    ? selected.complexity_score.toFixed(2)
                    : "—"
                }
              />
              <Field
                label="Similarity"
                value={
                  selected.cache_similarity != null
                    ? selected.cache_similarity.toFixed(3)
                    : "—"
                }
              />
              <Field label="Status" value={selected.status} />
              <Field label="Original" value={selected.original_prompt || selected.prompt} />
              <Field label="Optimized" value={selected.optimized_prompt || "—"} />
              <Field label="Response" value={selected.response || selected.error_message || "—"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
        {label}
      </div>
      <div className="text-on-surface whitespace-pre-wrap break-words">{value}</div>
    </div>
  );
}
