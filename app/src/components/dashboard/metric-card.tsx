"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    text: string;
  };
  icon: LucideIcon;
  accentColor?: "primary" | "secondary" | "tertiary";
  children?: React.ReactNode;
}

const accentMap = {
  primary: {
    iconHover: "group-hover:text-primary",
    trendText: "text-primary",
    trendBg: "bg-primary/10",
  },
  secondary: {
    iconHover: "group-hover:text-secondary",
    trendText: "text-secondary",
    trendBg: "bg-secondary/10",
  },
  tertiary: {
    iconHover: "group-hover:text-tertiary",
    trendText: "text-tertiary",
    trendBg: "bg-tertiary/10",
  },
};

export function MetricCard({
  label,
  value,
  unit,
  trend,
  icon: Icon,
  accentColor = "primary",
  children,
}: MetricCardProps) {
  const accent = accentMap[accentColor];

  return (
    <div className="glass-panel p-4 rounded-xl highlight-glow relative overflow-hidden flex flex-col justify-between h-32 group transition-all duration-300 hover:border-outline/50">
      {/* Header Row */}
      <div className="flex justify-between items-start">
        <span className="text-[13px] font-medium text-on-surface-variant">
          {label}
        </span>
        <Icon
          className={cn(
            "w-5 h-5 text-outline-variant transition-colors",
            accent.iconHover
          )}
        />
      </div>

      {/* Value + Trend or Custom Content */}
      {children ? (
        children
      ) : (
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[48px] font-semibold leading-[56px] tracking-[-0.02em] text-on-surface">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-on-surface-variant">{unit}</span>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.direction === "up" && (
                <svg className={cn("w-3.5 h-3.5", accent.trendText)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 17l6-6 4 4 8-8m0 0h-6m6 0v6" />
                </svg>
              )}
              {trend.direction === "down" && (
                <svg className={cn("w-3.5 h-3.5", accent.trendText)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l6 6 4-4 8 8m0 0h-6m6 0v-6" />
                </svg>
              )}
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded",
                  accent.trendText,
                  accent.trendBg
                )}
              >
                {trend.text}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
