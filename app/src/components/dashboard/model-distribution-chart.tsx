"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { NamedCount } from "@/lib/types";

const COLORS = ["#4d8eff", "#00a572", "#ca8100", "#424754", "#adc6ff"];

export function ModelDistributionChart({ data }: { data: NamedCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chart = data.map((d, i) => ({
    name: d.name,
    value: d.count,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col min-h-[320px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[24px] font-medium leading-8 tracking-[-0.01em] text-on-surface">
          Model Distribution
        </h3>
      </div>
      {chart.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant">
          No model traffic yet.
        </div>
      ) : (
        <>
          <div className="flex-1 relative w-full flex items-center justify-center">
            <div className="h-[200px] w-full max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chart.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      return (
                        <div className="bg-[#111827]/95 border border-[#374151] rounded-lg px-3 py-2 text-xs text-on-surface">
                          {payload[0].name}: {payload[0].value}
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chart.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[13px] text-on-surface-variant truncate">
                  {item.name} ({total ? Math.round((item.value / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
