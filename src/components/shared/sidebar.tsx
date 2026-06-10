import React from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

interface SidebarProps {
  currentPath: string;
  userName?: string;
  onLogout?: () => void;
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

export function Sidebar({ currentPath, userName, onLogout }: SidebarProps) {
  const { theme, resolvedTheme } = useTheme();
  const isActive = (href: string) => {
    if (href === "/dashboard") return currentPath === "/dashboard" || currentPath === "/";
    return currentPath.startsWith(href);
  };

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <aside className="hidden border-r border-[var(--separator)] bg-[rgba(246,246,248,0.85)] backdrop-blur-xl dark:bg-[rgba(28,28,30,0.82)] md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-6"
        style={{ borderBottom: "1px solid var(--separator)" }}
      >
        <Image
          src={isDark ? "/spendwise-light.png" : "/spendwise-dark.png"}
          alt="SpendWise"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <span className="text-[17px] font-semibold tracking-[-0.2px] text-[var(--text-primary)]">
          SpendWise
        </span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="nav-section-label mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--text-tertiary)]">
          Overview
        </p>
        <div className="space-y-0.5">
          {mainNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all duration-200",
                  active
                    ? "bg-[rgba(0,122,255,0.12)] font-semibold text-[var(--apple-blue)]"
                    : "text-[var(--text-secondary)] hover:bg-[rgba(120,120,128,0.10)]"
                )}
              >
                <span className="w-5 flex-shrink-0 text-center text-base leading-none">
                  {item.emoji}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <p className="nav-section-label mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--text-tertiary)]">
          System
        </p>
        <div className="space-y-0.5">
          {bottomNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all duration-200",
                  active
                    ? "bg-[rgba(0,122,255,0.12)] font-semibold text-[var(--apple-blue)]"
                    : "text-[var(--text-secondary)] hover:bg-[rgba(120,120,128,0.10)]"
                )}
              >
                <span className="w-5 flex-shrink-0 text-center text-base leading-none">
                  {item.emoji}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="space-y-3 border-t border-[var(--separator)] p-4">
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
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-[var(--apple-red)]"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
