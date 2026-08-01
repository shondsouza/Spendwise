import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LogOut,
  ChevronLeft,
  LayoutDashboard,
  CreditCard,
  Wallet,
  Handshake,
  Building2,
  BarChart3,
  Target,
  FolderOpen,
  Settings,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "./theme-toggle";

interface SidebarProps {
  currentPath: string;
  userName?: string;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/expenses", label: "Expenses", icon: CreditCard },
  { href: "/dashboard/income", label: "Income", icon: Wallet },
  { href: "/dashboard/lent", label: "Lent", icon: Handshake },
  { href: "/dashboard/loan", label: "Loans", icon: Building2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/budgets", label: "Budgets", icon: Target },
  { href: "/dashboard/categories", label: "Categories", icon: FolderOpen },
];

const bottomNav = [{ href: "/dashboard/settings", label: "Settings", icon: Settings }];

export function Sidebar({
  currentPath,
  userName,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
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
  const userInitial = (userName || "U").charAt(0).toUpperCase();

  const loadingSkeleton = (
    <div className="md:block hidden h-full w-full animate-pulse">
      <div className="flex items-center border-b border-[var(--separator)] px-5 py-5">
        <div className="h-8 w-8 rounded-xl bg-[rgba(120,120,128,0.16)]" />
        <div className="ml-3 h-4 w-24 rounded-full bg-[rgba(120,120,128,0.16)]" />
      </div>
      <div className="space-y-2 px-2.5 py-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-xl px-3 py-3">
            <div className="h-5 w-5 rounded-full bg-[rgba(120,120,128,0.14)]" />
            <div className="h-3 w-20 rounded-full bg-[rgba(120,120,128,0.14)]" />
          </div>
        ))}
      </div>
      <div className="mt-auto border-t border-[var(--separator)] p-3">
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <div className="h-9 w-9 rounded-full bg-[rgba(120,120,128,0.16)]" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-20 rounded-full bg-[rgba(120,120,128,0.14)]" />
            <div className="h-3 w-24 rounded-full bg-[rgba(120,120,128,0.14)]" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <aside
      className={cn(
        "hidden border-r border-[var(--separator)] md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-[72px]" : "md:w-64"
      )}
      style={{
        background: isDark ? "rgba(18, 18, 20, 0.88)" : "rgba(248, 248, 250, 0.88)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        visibility: mounted ? "visible" : "hidden",
        opacity: mounted ? 1 : 0,
        pointerEvents: mounted ? "auto" : "none",
      }}
    >
      {!mounted ? loadingSkeleton : null}
      {mounted ? (
        <>
          {/* Logo */}
          <div
            className={cn(
              "flex items-center py-5 relative transition-all duration-300",
              isCollapsed ? "px-3 justify-center" : "px-5 gap-3"
            )}
            style={{ borderBottom: "1px solid var(--separator)" }}
          >
            <Link
              href="/dashboard"
              aria-label="Go to dashboard"
              className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}
            >
              <Image
                src="/logo/logo.png"
                alt="SpendWise"
                width={34}
                height={34}
                className="rounded-xl flex-shrink-0"
              />
              {!isCollapsed && (
                <span className="text-[16px] font-bold tracking-[-0.4px] text-[var(--text-primary)] whitespace-nowrap overflow-hidden">
                  SpendWise
                </span>
              )}
            </Link>

            {/* Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className={cn(
                "absolute -right-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--separator)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] shadow-sm hover:text-[var(--apple-blue)] hover:border-[var(--apple-blue)] transition-all z-50",
                isCollapsed && "rotate-180"
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Main Nav */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-3">
            {!isCollapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-tertiary)]">
                Overview
              </p>
            )}
            <div className="space-y-0.5">
              {mainNav.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "sidebar-nav-item",
                      isCollapsed && "justify-center px-2",
                      active && "active"
                    )}
                  >
                    <Icon
                      className={cn(
                        "flex-shrink-0 transition-transform duration-200",
                        isCollapsed ? "h-5 w-5" : "h-4.5 w-4.5",
                        active && "scale-110"
                      )}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {active && !isCollapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--apple-blue)] flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>

            {!isCollapsed && (
              <p className="mb-1.5 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-tertiary)]">
                System
              </p>
            )}
            {isCollapsed && <div className="my-3 mx-2 h-px bg-[var(--separator)]" />}
            <div className="space-y-0.5">
              {bottomNav.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "sidebar-nav-item",
                      isCollapsed && "justify-center px-2",
                      active && "active"
                    )}
                  >
                    <Icon
                      className={cn(
                        "flex-shrink-0",
                        isCollapsed ? "h-5 w-5" : "h-4.5 w-4.5",
                        active && "scale-110"
                      )}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div
            className={cn("transition-all duration-300", isCollapsed ? "p-2.5" : "p-3")}
            style={{ borderTop: "1px solid var(--separator)" }}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-2.5 mb-3 px-1">
                {/* User avatar */}
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white font-bold text-[14px]"
                  style={{ background: "var(--gradient-blue)" }}
                >
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)]">
                    Account
                  </p>
                  <p className="truncate text-[13px] font-semibold text-[var(--text-primary)] mt-0.5">
                    {userName || "User"}
                  </p>
                </div>
                <ThemeToggle />
              </div>
            )}
            {isCollapsed && (
              <div className="flex justify-center mb-2">
                <ThemeToggle />
              </div>
            )}
            <button
              onClick={onLogout}
              title={isCollapsed ? "Logout" : undefined}
              className={cn(
                "w-full flex items-center gap-2 rounded-xl bg-[rgba(255,59,48,0.07)] text-[var(--apple-red)] px-3 py-2.5 text-[13px] font-semibold transition-all hover:bg-[rgba(255,59,48,0.13)] active:scale-97",
                isCollapsed ? "justify-center" : "justify-start"
              )}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>Log out</span>}
            </button>
          </div>
        </>
      ) : null}
    </aside>
  );
}
