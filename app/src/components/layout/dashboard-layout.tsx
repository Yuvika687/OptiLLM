"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F19]">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-surface border-r border-outline-variant">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileMenuOpen(false)}
            variant="mobile"
          />
        </SheetContent>
      </Sheet>

      {/* Top Bar */}
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 overflow-y-auto pt-16 transition-all duration-300",
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-16"
        )}
      >
        <div className="p-4 lg:p-8 max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
