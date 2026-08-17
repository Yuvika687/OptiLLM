"use client";

import { useEffect, useState } from "react";
import { clearCache, deleteCacheEntry, fetchCache } from "@/lib/api";
import type { CacheList } from "@/lib/types";

export default function CachePage() {
  const [data, setData] = useState<CacheList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () =>
    fetchCache()
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );

  useEffect(() => {
    reload();
  }, []);

  const onClear = async () => {
    setBusy(true);
    try {
      await clearCache();
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to clear");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: number) => {
    setBusy(true);
    try {
      await deleteCacheEntry(id);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-semibold tracking-tight text-on-surface leading-10">
            Cache Management
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Semantic clusters stored as embeddings. Hits skip the LLM.
          </p>
        </div>
        <button
          onClick={onClear}
          disabled={busy || !data?.entry_count}
          className="px-3 py-1.5 rounded-lg text-[13px] border border-error/40 text-error hover:bg-error/10 disabled:opacity-40"
        >
          Clear all cache
        </button>
      </div>

      {error && (
        <div className="glass-panel rounded-xl p-4 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Cached prompts" value={String(data?.entry_count ?? 0)} />
        <Stat
          label="Hit rate (7d)"
          value={`${Math.round((data?.hit_rate_7d ?? 0) * 100)}%`}
        />
        <Stat
          label="Similarity threshold"
          value={data ? data.threshold.toFixed(2) : "—"}
        />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#1F2937] bg-[#0B0F19]/50">
              {["Prompt", "Model", "Hits", "Last similarity", "Saved cost", ""].map(
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
          <tbody className="text-sm">
            {!data?.items.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                  Cache is empty. Send a playground prompt, then repeat a similar
                  one to create a hit.
                </td>
              </tr>
            ) : (
              data.items.map((row) => (
                <tr key={row.id} className="border-b border-[#1F2937]/50">
                  <td className="px-4 py-3 text-on-surface max-w-[360px] truncate" title={row.prompt}>
                    {row.prompt}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-on-surface-variant">
                    {row.model}
                  </td>
                  <td className="px-4 py-3 text-secondary font-semibold">{row.hit_count}</td>
                  <td className="px-4 py-3 font-mono text-[13px]">
                    {row.last_similarity != null
                      ? row.last_similarity.toFixed(3)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px]">
                    ${(row.cost_usd * row.hit_count).toFixed(6)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(row.id)}
                      className="text-[12px] text-error hover:underline"
                    >
                      Delete
                    </button>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
        {label}
      </div>
      <div className="text-[28px] font-semibold text-on-surface mt-2">{value}</div>
    </div>
  );
}
