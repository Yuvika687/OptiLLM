"use client";

import { useEffect, useState } from "react";
import { Activity, DollarSign, Gauge, Timer } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { DailySpendChart } from "@/components/dashboard/daily-spend-chart";
import { ModelDistributionChart } from "@/components/dashboard/model-distribution-chart";
import { IntentChart } from "@/components/dashboard/intent-chart";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";
import { fetchAnalytics, fetchRequests } from "@/lib/api";
import type { AnalyticsOverview, RequestRow } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [recent, setRecent] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAnalytics(14), fetchRequests({ limit: 8 })])
      .then(([overview, reqs]) => {
        if (cancelled) return;
        setData(overview);
        setRecent(reqs.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hitPct = Math.round((data?.cache_hit_rate ?? 0) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[32px] font-semibold tracking-tight text-on-surface leading-10">
          Overview
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Live gateway metrics from Postgres — last 14 days.
        </p>
      </div>

      {error && (
        <div className="glass-panel rounded-xl p-4 text-sm text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Requests"
          value={data ? String(data.total_requests) : "—"}
          icon={Activity}
          accentColor="primary"
        />
        <MetricCard
          label="Est. Cost Saved"
          value={data ? `$${data.cost_saved_usd.toFixed(3)}` : "—"}
          icon={DollarSign}
          accentColor="secondary"
          trend={
            data
              ? {
                  direction: "up",
                  text: `vs $${data.baseline_cost_usd.toFixed(3)} baseline`,
                }
              : undefined
          }
        />
        <MetricCard label="Cache Hit Rate" value="" icon={Gauge} accentColor="primary">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#1F2937" strokeWidth="6" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#4d8eff"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(hitPct / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-on-surface">
                {data ? `${hitPct}%` : "—"}
              </span>
            </div>
            <div>
              <span className="text-[32px] font-semibold leading-none tracking-[-0.02em] text-on-surface">
                {data ? `${hitPct}%` : "—"}
              </span>
              <div className="text-[11px] text-on-surface-variant mt-1">
                Hits vs all logged requests
              </div>
            </div>
          </div>
        </MetricCard>
        <MetricCard
          label="Avg Latency"
          value={data ? String(Math.round(data.avg_latency_ms)) : "—"}
          unit="ms"
          icon={Timer}
          accentColor="secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DailySpendChart data={data?.timeseries ?? []} />
        <ModelDistributionChart data={data?.models ?? []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <IntentChart data={data?.intents ?? []} />
        <RecentActivityTable rows={recent} />
      </div>
    </div>
  );
}
