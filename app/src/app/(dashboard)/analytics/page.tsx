"use client";

import { useEffect, useState } from "react";
import { DailySpendChart } from "@/components/dashboard/daily-spend-chart";
import { ModelDistributionChart } from "@/components/dashboard/model-distribution-chart";
import { IntentChart } from "@/components/dashboard/intent-chart";
import { fetchAnalytics } from "@/lib/api";
import type { AnalyticsOverview } from "@/lib/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics(30)
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[32px] font-semibold tracking-tight text-on-surface leading-10">
          Analytics Overview
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Last 30 days of real gateway traffic. Savings are billed cost versus
          sending every request to the expensive model.
        </p>
      </div>

      {error && (
        <div className="glass-panel rounded-xl p-4 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Requests" value={String(data?.total_requests ?? 0)} />
        <Stat
          label="Actual spend"
          value={`$${(data?.total_cost_usd ?? 0).toFixed(4)}`}
        />
        <Stat
          label="Baseline spend"
          value={`$${(data?.baseline_cost_usd ?? 0).toFixed(4)}`}
        />
        <Stat
          label="Saved"
          value={`$${(data?.cost_saved_usd ?? 0).toFixed(4)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DailySpendChart data={data?.timeseries ?? []} />
        <ModelDistributionChart data={data?.models ?? []} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IntentChart data={data?.intents ?? []} />
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-[24px] font-medium text-on-surface mb-4">Providers</h3>
          {(data?.providers ?? []).length === 0 ? (
            <p className="text-sm text-on-surface-variant">No provider traffic yet.</p>
          ) : (
            <ul className="space-y-3">
              {data?.providers.map((p) => (
                <li key={p.name} className="flex justify-between text-sm">
                  <span className="text-on-surface capitalize">{p.name}</span>
                  <span className="text-on-surface-variant">
                    {p.count} req · ${p.cost.toFixed(4)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
      <div className="text-[24px] font-semibold text-on-surface mt-2">{value}</div>
    </div>
  );
}
