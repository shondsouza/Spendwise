import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

interface SidebarProps {
  currentPath: string;
  userName?: string;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const mainNav = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊" },
  { href: "/dashboard/expenses", label: "Expenses", emoji: "💳" },
  { href: "/dashboard/income", label: "Income", emoji: "💰" },
  { href: "/dashboard/lent", label: "Lent", emoji: "🤝" },
  { href: "/dashboard/loan", label: "Loan", emoji: "🏦" },
  { href: "/dashboard/analytics", label: "Analytics", emoji: "📈" },
  { href: "/dashboard/budgets", label: "Budgets", emoji: "🎯" },
  { href: "/dashboard/categories", label: "Categories", emoji: "📂" },
];

const bottomNav = [
  { href: "/dashboard/settings", label: "Settings", emoji: "⚙️" },
];

export function Sidebar({ currentPath, userName, onLogout, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return currentPath === "/dashboard" || currentPath === "/";
    return currentPath.startsWith(href);
  };

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <aside 
      className={cn(
        "hidden border-r border-[var(--separator)] bg-[rgba(246,246,248,0.85)] backdrop-blur-xl dark:bg-[rgba(28,28,30,0.82)] md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-[80px]" : "md:w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center py-6 relative transition-all duration-300",
          isCollapsed ? "px-4 justify-center" : "px-6 gap-3"
        )}
        style={{ borderBottom: "1px solid var(--separator)" }}
      >
        <Image
          src={mounted ? (isDark ? "/spendwise-light.png" : "/spendwise-dark.png") : "/spendwise-dark.png"}
          alt="SpendWise"
          width={36}
          height={36}
          className="rounded-lg flex-shrink-0"
        />
        {!isCollapsed && (
          <span className="text-[17px] font-semibold tracking-[-0.2px] text-[var(--text-primary)] whitespace-nowrap overflow-hidden">
            SpendWise
          </span>
        )}
        
        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            "absolute -right-3.5 top-8 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--separator)] bg-[var(--bg-primary)] text-[var(--text-secondary)] shadow-sm hover:text-[var(--apple-blue)] transition-colors z-50",
            isCollapsed && "rotate-180"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {!isCollapsed && (
          <p className="nav-section-label mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--text-tertiary)]">
            Overview
          </p>
        )}
        <div className="space-y-0.5">
          {mainNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg py-2 transition-all duration-200 group relative",
                  isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                  active
                    ? "bg-[rgba(0,122,255,0.12)] font-semibold text-[var(--apple-blue)]"
                    : "text-[var(--text-secondary)] hover:bg-[rgba(120,120,128,0.10)]"
                )}
              >
                {active && isCollapsed && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-md bg-[var(--apple-blue)]" />
                )}
                <span className={cn("flex-shrink-0 text-center leading-none", isCollapsed ? "text-xl" : "w-5 text-base")}>
                  {item.emoji}
                </span>
                {!isCollapsed && (
                  <span className="truncate text-[14px]">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>

        {!isCollapsed && (
          <p className="nav-section-label mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--text-tertiary)]">
            System
          </p>
        )}
        <div className="space-y-0.5">
          {bottomNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg py-2 transition-all duration-200 group relative",
                  isCollapsed ? "justify-center px-0 mt-4" : "gap-3 px-3",
                  active
                    ? "bg-[rgba(0,122,255,0.12)] font-semibold text-[var(--apple-blue)]"
                    : "text-[var(--text-secondary)] hover:bg-[rgba(120,120,128,0.10)]"
                )}
              >
                {active && isCollapsed && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-md bg-[var(--apple-blue)]" />
                )}
                <span className={cn("flex-shrink-0 text-center leading-none", isCollapsed ? "text-xl" : "w-5 text-base")}>
                  {item.emoji}
                </span>
                {!isCollapsed && (
                  <span className="truncate text-[14px]">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className={cn("space-y-3 border-t border-[var(--separator)] transition-all duration-300", isCollapsed ? "p-3" : "p-4")}>
        {!isCollapsed && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)]">
                Profile
              </p>
              <p className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
                {userName || "User"}
              </p>
            </div>
            <ThemeToggle />
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center mb-3">
            <ThemeToggle />
          </div>
        )}
        <Button
          variant="outline"
          className={cn("w-full text-[var(--apple-red)]", isCollapsed ? "px-0 justify-center" : "justify-start gap-2")}
          onClick={onLogout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
