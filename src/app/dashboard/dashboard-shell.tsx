"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  LogOut,
  FolderTree,
  Settings,
  Target,
  Handshake,
  Building2,
  LayoutDashboard,
  CreditCard,
  Wallet,
  PieChart,
  MoreHorizontal,
} from "lucide-react";

import { Sidebar } from "@/components/shared/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";
import { PWAInstallBanner } from "@/components/shared/pwa-install-banner";
import { useHaptic } from "@/hooks/use-haptic";

import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
}

const mainNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/expenses", label: "Expenses", icon: CreditCard },
  { href: "/dashboard/income", label: "Income", icon: Wallet },
  { href: "/dashboard/analytics", label: "Analytics", icon: PieChart },
];

const moreNav = [
  { href: "/dashboard/lent", label: "Lent Money", emoji: "🤝", icon: Handshake },
  { href: "/dashboard/loan", label: "Loans", emoji: "🏦", icon: Building2 },
  { href: "/dashboard/budgets", label: "Budgets", emoji: "🎯", icon: Target },
  { href: "/dashboard/categories", label: "Categories", emoji: "📂", icon: FolderTree },
  { href: "/dashboard/settings", label: "Settings", emoji: "⚙️", icon: Settings },
];

const sidebarNav = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊" },
  { href: "/dashboard/expenses", label: "Expenses", emoji: "💳" },
  { href: "/dashboard/income", label: "Income", emoji: "💰" },
  { href: "/dashboard/lent", label: "Lent", emoji: "🤝" },
  { href: "/dashboard/loan", label: "Loan", emoji: "🏦" },
  { href: "/dashboard/analytics", label: "Analytics", emoji: "📈" },
  { href: "/dashboard/budgets", label: "Budgets", emoji: "🎯" },
  { href: "/dashboard/categories", label: "Categories", emoji: "📂" },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard" || pathname === "/") return "Dashboard";
  if (pathname.startsWith("/dashboard/expenses")) return "Expenses";
  if (pathname.startsWith("/dashboard/income")) return "Income";
  if (pathname.startsWith("/dashboard/analytics")) return "Analytics";
  if (pathname.startsWith("/dashboard/lent")) return "Lent Money";
  if (pathname.startsWith("/dashboard/loan")) return "Loans";
  if (pathname.startsWith("/dashboard/budgets")) return "Budgets";
  if (pathname.startsWith("/dashboard/categories")) return "Categories";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "SpendWise";
}

export default function DashboardShell({ children, userName }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { haptic } = useHaptic();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  const isMoreActive = moreNav.some((item) => isActive(item.href));
  const pageTitle = getPageTitle(pathname);
  const userInitial = (userName || "U").charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      {/* Desktop Sidebar */}
      <Sidebar
        currentPath={pathname}
        userName={userName}
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Mobile Slide-in Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            style={{ animation: "fadeIn 0.2s ease both" }}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-[300px] md:hidden flex flex-col"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(48px) saturate(200%)",
              WebkitBackdropFilter: "blur(48px) saturate(200%)",
              borderRight: "1px solid var(--separator)",
              animation: "slideInLeft 0.3s var(--ease-out-expo) both",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: "1px solid var(--separator)" }}>
              <div className="flex items-center gap-2.5">
                <Image src="/spendwise-dark.png" alt="SpendWise" width={30} height={30} className="rounded-xl dark:hidden" />
                <Image src="/spendwise-light.png" alt="SpendWise" width={30} height={30} className="rounded-xl hidden dark:block" />
                <span className="text-[17px] font-bold tracking-[-0.4px] text-[var(--text-primary)]">SpendWise</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(120,120,128,0.1)] text-[var(--text-secondary)] transition-all active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User info */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--separator)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white font-bold text-[16px] flex-shrink-0"
                  style={{ background: "var(--gradient-blue)" }}
                >
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)]">Signed in</p>
                  <p className="text-[15px] font-semibold text-[var(--text-primary)] truncate max-w-[180px] mt-0.5">{userName || "User"}</p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <PWAInstallBanner />
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {[...sidebarNav].map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-all duration-200",
                      active
                        ? "bg-[rgba(0,122,255,0.11)] text-[var(--apple-blue)] font-semibold"
                        : "text-[var(--text-secondary)] hover:bg-[rgba(120,120,128,0.08)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <span className="w-6 text-center text-xl leading-none">{item.emoji}</span>
                    <span className="tracking-[-0.2px]">{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--apple-blue)]" />}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 space-y-3" style={{ borderTop: "1px solid var(--separator)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Appearance</span>
                <ThemeToggle />
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[rgba(255,59,48,0.08)] text-[var(--apple-red)] px-4 py-3 text-[14px] font-semibold transition-all hover:bg-[rgba(255,59,48,0.14)] active:scale-97"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* "More" drawer on mobile */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+8px)] left-4 right-4 z-50 md:hidden"
            style={{ animation: "fadeSlideUp 0.25s var(--ease-out-expo) both" }}
          >
            <div
              className="rounded-2xl overflow-hidden p-2"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(40px) saturate(200%)",
                WebkitBackdropFilter: "blur(40px) saturate(200%)",
                border: "1px solid var(--glass-border)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--text-tertiary)]">More</p>
              <div className="grid grid-cols-3 gap-1">
                {moreNav.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-all active:scale-95",
                        active
                          ? "bg-[rgba(0,122,255,0.12)] text-[var(--apple-blue)]"
                          : "text-[var(--text-primary)] hover:bg-[rgba(120,120,128,0.08)]"
                      )}
                    >
                      <span className="text-2xl leading-none">{item.emoji}</span>
                      <span className="text-[11px] font-medium tracking-[-0.1px]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out",
          isCollapsed ? "md:ml-[80px]" : "md:ml-64"
        )}
      >
        {/* Mobile top header */}
        <header
          className="flex items-center justify-between px-4 py-3 md:hidden sticky top-0 z-30"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(24px) saturate(200%)",
            WebkitBackdropFilter: "blur(24px) saturate(200%)",
            borderBottom: "1px solid var(--separator)",
          }}
        >
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(120,120,128,0.10)] text-[var(--text-primary)] transition-all active:scale-90"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="text-[17px] font-bold tracking-[-0.4px] text-[var(--text-primary)]">
            {pageTitle}
          </span>

          <ThemeToggle />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto pb-24 md:pb-0">
          <PullToRefresh>
            <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">{children}</div>
          </PullToRefresh>
        </div>

        {/* Premium Mobile Bottom Tab Bar */}
        <nav className="bottom-nav md:hidden">
          <div className="bottom-nav-inner">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("bottom-nav-item", active && "active", "active:scale-95 transition-transform duration-200")}
                  onClick={() => {
                    haptic('light');
                    if (moreOpen) setMoreOpen(false);
                  }}
                >
                  <div className="nav-icon-wrap">
                    <Icon className={cn("h-[22px] w-[22px]", active ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
                  </div>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-pill" />
                </Link>
              );
            })}
            {/* More button */}
            <button
              onClick={() => {
                haptic('light');
                setMoreOpen(!moreOpen);
              }}
              className={cn("bottom-nav-item", (isMoreActive || moreOpen) && "active", "active:scale-95 transition-transform duration-200")}
            >
              <div className="nav-icon-wrap">
                <MoreHorizontal className={cn("h-[22px] w-[22px]", (isMoreActive || moreOpen) ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
              </div>
              <span className="nav-label">More</span>
              <span className="nav-pill" />
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
