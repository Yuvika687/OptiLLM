"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { NamedCount } from "@/lib/types";

export function IntentChart({ data }: { data: NamedCount[] }) {
  const chart = data.map((d) => ({ name: d.name, requests: d.count }));

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col min-h-[380px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[24px] font-medium leading-8 tracking-[-0.01em] text-on-surface">
          Requests by Intent
        </h3>
      </div>
      <div className="flex-1 w-full min-h-0">
        {chart.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">
            No classified requests yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#1F2937" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#8c909f", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8c909f", fontSize: 12 }}
                width={90}
              />
              <Tooltip
                cursor={{ fill: "rgba(31, 41, 55, 0.5)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.[0]) return null;
                  return (
                    <div className="bg-[#111827]/95 border border-[#374151] rounded-lg px-3 py-2 text-xs text-on-surface">
                      {label}: {payload[0].value} requests
                    </div>
                  );
                }}
              />
              <Bar dataKey="requests" fill="#adc6ff" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
