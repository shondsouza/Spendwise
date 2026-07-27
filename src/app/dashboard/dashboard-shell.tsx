"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Bell,
  Menu,
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
  { href: "/dashboard/lent", label: "Lent Money", icon: Handshake },
  { href: "/dashboard/loan", label: "Loans", icon: Building2 },
  { href: "/dashboard/budgets", label: "Budgets", icon: Target },
  { href: "/dashboard/categories", label: "Categories", icon: FolderTree },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const sidebarNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/expenses", label: "Expenses", icon: CreditCard },
  { href: "/dashboard/income", label: "Income", icon: Wallet },
  { href: "/dashboard/lent", label: "Lent", icon: Handshake },
  { href: "/dashboard/loan", label: "Loan", icon: Building2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: PieChart },
  { href: "/dashboard/budgets", label: "Budgets", icon: Target },
  { href: "/dashboard/categories", label: "Categories", icon: FolderTree },
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
    <div className="dashboard-app-shell flex h-screen bg-[var(--bg-primary)]">
      <Sidebar
        currentPath={pathname}
        userName={userName}
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {mobileMenuOpen && (
        <>
          <button
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            style={{ animation: "fadeIn 0.2s ease both" }}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[86vw] flex-col md:hidden"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(48px) saturate(200%)",
              WebkitBackdropFilter: "blur(48px) saturate(200%)",
              borderRight: "1px solid var(--separator)",
              animation: "slideInLeft 0.3s var(--ease-out-expo) both",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-5"
              style={{ borderBottom: "1px solid var(--separator)" }}
            >
              <Link
                href="/dashboard"
                aria-label="Go to dashboard"
                className="flex items-center gap-2.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Image
                  src="/logo/logo.png"
                  alt="SpendWise"
                  width={30}
                  height={30}
                  className="rounded-xl"
                />
                <span className="text-[17px] font-bold tracking-[-0.4px] text-[var(--text-primary)]">
                  SpendWise
                </span>
              </Link>
              <button
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(120,120,128,0.1)] text-[var(--text-secondary)] transition-all active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--separator)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-white"
                  style={{ background: "var(--gradient-blue)" }}
                >
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--text-tertiary)]">
                    Signed in
                  </p>
                  <p className="mt-0.5 max-w-[180px] truncate text-[15px] font-semibold text-[var(--text-primary)]">
                    {userName || "User"}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
              {sidebarNav.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-all duration-200",
                      active
                        ? "bg-[rgba(0,122,255,0.11)] font-semibold text-[var(--apple-blue)]"
                        : "text-[var(--text-secondary)] hover:bg-[rgba(120,120,128,0.08)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(120,120,128,0.08)]">
                      <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.4 : 1.9} />
                    </span>
                    <span className="tracking-[-0.2px]">{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--apple-blue)]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-3 p-4" style={{ borderTop: "1px solid var(--separator)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                  Appearance
                </span>
                <ThemeToggle />
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[rgba(255,59,48,0.08)] px-4 py-3 text-[14px] font-semibold text-[var(--apple-red)] transition-all hover:bg-[rgba(255,59,48,0.14)] active:scale-97"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {moreOpen && (
        <>
          <button
            aria-label="Close more menu"
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+8px)] left-4 right-4 z-50 md:hidden"
            style={{ animation: "fadeSlideUp 0.25s var(--ease-out-expo) both" }}
          >
            <div
              className="overflow-hidden rounded-2xl p-2"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(40px) saturate(200%)",
                WebkitBackdropFilter: "blur(40px) saturate(200%)",
                border: "1px solid var(--glass-border)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--text-tertiary)]">
                More
              </p>
              <div className="grid grid-cols-3 gap-1">
                {moreNav.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
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
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
                      <span className="text-[11px] font-medium tracking-[-0.1px]">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <main
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out",
          isCollapsed ? "md:ml-[72px]" : "md:ml-64"
        )}
      >
        <header
          className="mobile-app-header sticky top-0 z-30 flex items-center justify-between px-5 py-4 md:hidden"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(24px) saturate(200%)",
            WebkitBackdropFilter: "blur(24px) saturate(200%)",
            borderBottom: "1px solid var(--separator)",
          }}
        >
          <Link
            href="/dashboard"
            aria-label="Go to dashboard"
            className="flex items-center gap-3 text-left"
          >
            <Image src="/logo/mobile-top-header.png" alt="" width={50} height={50} />
            <span className="max-w-[58vw] truncate text-[26px] font-bold tracking-[-1px] text-[var(--text-primary)]">
              {pathname === "/dashboard" ? "SpendWise" : pageTitle}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-notification-button"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button aria-label="Notifications" className="mobile-notification-button">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        <PWAInstallBanner />

        <div className="flex-1 overflow-auto mobile-pb md:pb-0">
          <PullToRefresh>
            <div className="mobile-scroll-content mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
              {children}
            </div>
          </PullToRefresh>
        </div>

        <nav className="bottom-nav mobile-dock md:hidden" aria-label="Primary navigation">
          <div className="bottom-nav-inner">
            {mainNav.slice(0, 2).map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "bottom-nav-item",
                    active && "active",
                    "active:scale-95 transition-transform duration-200"
                  )}
                  onClick={() => {
                    haptic("light");
                    if (moreOpen) setMoreOpen(false);
                  }}
                >
                  <div className="nav-icon-wrap">
                    <Icon
                      className={cn(
                        "h-[22px] w-[22px]",
                        active ? "stroke-[2.5px]" : "stroke-[1.8px]"
                      )}
                    />
                  </div>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-pill" />
                </Link>
              );
            })}
            <Link
              href="/dashboard/expenses"
              aria-label="Add transaction"
              className="mobile-add-button"
              onClick={() => haptic("medium")}
            >
              <span>+</span>
              <small>Add</small>
            </Link>
            <Link
              href="/dashboard/income"
              aria-current={pathname.startsWith("/dashboard/income") ? "page" : undefined}
              className={cn(
                "bottom-nav-item",
                pathname.startsWith("/dashboard/income") && "active",
                "active:scale-95 transition-transform duration-200"
              )}
              onClick={() => haptic("light")}
            >
              <div className="nav-icon-wrap">
                <Wallet
                  className={cn(
                    "h-[22px] w-[22px]",
                    pathname.startsWith("/dashboard/income") ? "stroke-[2.5px]" : "stroke-[1.8px]"
                  )}
                />
              </div>
              <span className="nav-label">Income</span>
              <span className="nav-pill" />
            </Link>
            <button
              aria-label="Open more navigation"
              aria-expanded={moreOpen}
              onClick={() => {
                haptic("light");
                setMoreOpen(!moreOpen);
              }}
              className={cn(
                "bottom-nav-item",
                (isMoreActive || moreOpen) && "active",
                "active:scale-95 transition-transform duration-200"
              )}
            >
              <div className="nav-icon-wrap">
                <MoreHorizontal
                  className={cn(
                    "h-[22px] w-[22px]",
                    isMoreActive || moreOpen ? "stroke-[2.5px]" : "stroke-[1.8px]"
                  )}
                />
              </div>
              <span className="nav-label">Profile</span>
              <span className="nav-pill" />
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
