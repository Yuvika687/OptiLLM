"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FlaskConical,
  History,
  Database,
  Route,
  FileText,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Hexagon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Playground", href: "/playground", icon: FlaskConical },
  { label: "Requests", href: "/requests", icon: History },
  { label: "Cache", href: "/cache", icon: Database },
  { label: "Models & Routing", href: "/models-and-routing", icon: Route },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  variant?: "desktop" | "mobile";
}

export function Sidebar({
  collapsed,
  onToggle,
  variant = "desktop",
}: SidebarProps) {
  const pathname = usePathname();
  const isMobile = variant === "mobile";

  return (
    <nav
      className={cn(
        "h-full bg-surface border-r border-outline-variant",
        "flex flex-col py-6 z-40 transition-all duration-300 ease-in-out",
        isMobile
          ? "relative w-full"
          : cn(
              "fixed left-0 top-0 h-screen hidden lg:flex",
              collapsed ? "w-16" : "w-64"
            )
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 mb-8 transition-all duration-300",
          !isMobile && collapsed ? "px-3 justify-center" : "px-4"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 text-primary shrink-0">
          <Hexagon className="w-5 h-5" fill="currentColor" />
        </div>
        {(isMobile || !collapsed) && (
          <div className="overflow-hidden">
            <h1 className="text-xl font-bold text-primary tracking-tight leading-none">
              OptiLLM
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant leading-none mt-0.5">
              AI Gateway
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onToggle : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg transition-colors duration-200 group relative",
                !isMobile && collapsed
                  ? "px-3 py-2.5 justify-center"
                  : "px-3 py-2.5",
                isActive
                  ? "text-primary font-bold border-l-2 border-primary bg-primary-container/10"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest border-l-2 border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0",
                  isActive
                    ? "text-primary"
                    : "text-on-surface-variant group-hover:text-on-surface"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {(isMobile || !collapsed) && (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="px-2 mt-auto flex flex-col gap-2">
        <Link
          href="/settings"
          onClick={isMobile ? onToggle : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg transition-colors duration-200 group",
            !isMobile && collapsed
              ? "px-3 py-2.5 justify-center"
              : "px-3 py-2.5",
            pathname === "/settings"
              ? "text-primary font-bold border-l-2 border-primary bg-primary-container/10"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest border-l-2 border-transparent"
          )}
        >
          <Settings
            className={cn(
              "w-5 h-5 shrink-0",
              pathname === "/settings"
                ? "text-primary"
                : "text-on-surface-variant group-hover:text-on-surface"
            )}
            strokeWidth={pathname === "/settings" ? 2.5 : 2}
          />
          {(isMobile || !collapsed) && (
            <span className="text-sm">Settings</span>
          )}
        </Link>

        {!isMobile && (
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-colors duration-200 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest",
              collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="w-5 h-5 shrink-0" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        )}

        {(isMobile || !collapsed) && (
          <div className="glass-panel p-3 rounded-lg flex items-center gap-2 mt-1">
            <Avatar className="w-8 h-8 border border-outline-variant">
              <AvatarFallback className="bg-primary-container text-on-primary-container text-xs font-bold">
                OL
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm text-on-surface truncate">Gateway Admin</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant truncate">
                Local / Prod
              </p>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
