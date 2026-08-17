"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TimeseriesPoint } from "@/lib/types";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#111827]/95 backdrop-blur-sm border border-[#374151] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] font-semibold text-on-surface-variant mb-1">
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs text-on-surface">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: entry.color }}
          />
          {entry.dataKey === "cost" ? "Actual Cost" : "Cost Saved"}: $
          {Number(entry.value).toFixed(4)}
        </p>
      ))}
    </div>
  );
}

export function DailySpendChart({ data }: { data: TimeseriesPoint[] }) {
  const points = data.map((d) => ({
    day: d.date.slice(5),
    cost: Number(d.cost.toFixed(4)),
    saved: Number(d.saved.toFixed(4)),
  }));

  return (
    <div className="glass-panel rounded-xl p-4 lg:col-span-2 flex flex-col min-h-[320px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[24px] font-medium leading-8 tracking-[-0.01em] text-on-surface">
          Daily Spend vs Savings
        </h3>
      </div>
      <div className="flex-1 w-full min-h-0">
        {points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">
            No requests yet — send one from the Playground.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4d8eff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#4d8eff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSaved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#4edea3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1F2937" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8c909f", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8c909f", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                align="right"
                verticalAlign="top"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-on-surface-variant text-xs ml-1">
                    {value === "cost" ? "Actual Cost ($)" : "Cost Saved ($)"}
                  </span>
                )}
              />
              <Area type="monotone" dataKey="cost" stroke="#4d8eff" strokeWidth={2} fill="url(#gradCost)" />
              <Area
                type="monotone"
                dataKey="saved"
                stroke="#4edea3"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#gradSaved)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
