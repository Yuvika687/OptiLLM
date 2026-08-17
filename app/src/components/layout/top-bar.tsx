"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HelpCircle, Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/playground": "Playground",
  "/requests": "Requests",
  "/cache": "Cache",
  "/models-and-routing": "Models & Routing",
  "/documents": "Documents",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

interface TopBarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

export function TopBar({ sidebarCollapsed, onMobileMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const currentPage =
    Object.entries(pageTitles).find(
      ([path]) => pathname === path || pathname.startsWith(path + "/")
    )?.[1] ?? "OptiLLM";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant",
        "flex justify-between items-center px-6 z-30 transition-all duration-300",
        sidebarCollapsed ? "lg:left-16" : "lg:left-64"
      )}
    >
      <div className="flex items-center gap-6 h-full">
        <button
          className="lg:hidden text-on-surface-variant hover:text-primary transition-colors"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-on-surface-variant">OptiLLM</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-medium">{currentPage}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-[0.05em] text-secondary bg-secondary/10 px-2 py-1 rounded border border-secondary/20">
          Live data
        </span>
        <a
          href="https://github.com/Yuvika687/OptiLLM"
          target="_blank"
          rel="noreferrer"
          className="text-on-surface-variant hover:text-primary p-2 rounded-lg transition-colors hover:bg-surface-container-highest"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </a>
      </div>
    </header>
  );
}
