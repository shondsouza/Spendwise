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
  Building2
} from "lucide-react";
import { 
  IoHomeOutline, IoHome, 
  IoCardOutline, IoCard, 
  IoWalletOutline, IoWallet,
  IoPieChartOutline, IoPieChart,
  IoEllipsisHorizontalOutline, IoEllipsisHorizontal
} from "react-icons/io5";

import { Sidebar } from "@/components/shared/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
}

const mainNav = [
  { href: "/dashboard", label: "Home", icon: IoHomeOutline, activeIcon: IoHome },
  { href: "/dashboard/expenses", label: "Expenses", icon: IoCardOutline, activeIcon: IoCard },
  { href: "/dashboard/income", label: "Income", icon: IoWalletOutline, activeIcon: IoWallet },
  { href: "/dashboard/analytics", label: "Analytics", icon: IoPieChartOutline, activeIcon: IoPieChart },
];

const moreNav = [
  { href: "/dashboard/lent", label: "Lent", emoji: "🤝", icon: Handshake },
  { href: "/dashboard/loan", label: "Loan", emoji: "🏦", icon: Building2 },
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

export default function DashboardShell({ children, userName }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--separator)] bg-[rgba(246,246,248,0.98)] backdrop-blur-xl dark:bg-[rgba(28,28,30,0.98)] md:hidden flex flex-col"
            style={{ animation: "slideInRight 0.28s var(--ease-spring)" }}
          >
            <div className="flex items-center justify-between border-b border-[var(--separator)] px-5 py-5">
              <div className="flex items-center gap-3">
                <Image src="/spendwise-dark.png" alt="SpendWise" width={32} height={32} className="rounded-lg dark:hidden" />
                <Image src="/spendwise-light.png" alt="SpendWise" width={32} height={32} className="rounded-lg hidden dark:block" />
                <span className="text-[17px] font-bold tracking-[-0.3px] text-[var(--text-primary)]">SpendWise</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(120,120,128,0.12)] text-[var(--text-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* User info */}
            <div className="px-5 py-4 border-b border-[var(--separator)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(0,122,255,0.12)] text-[var(--apple-blue)] font-bold text-base">
                  {(userName || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] text-[var(--text-tertiary)] font-medium">Signed in as</p>
                  <p className="text-[15px] font-semibold text-[var(--text-primary)] truncate max-w-[170px]">{userName || "User"}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-1">
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
                          ? "bg-[rgba(0,122,255,0.12)] text-[var(--apple-blue)] font-semibold"
                          : "text-[var(--text-secondary)] hover:bg-[rgba(120,120,128,0.08)]"
                      )}
                    >
                      <span className="w-6 text-center text-xl leading-none">{item.emoji}</span>
                      <span>{item.label}</span>
                      {active && <span className="ml-auto h-2 w-2 rounded-full bg-[var(--apple-blue)]" />}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-[var(--separator)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--text-secondary)] font-medium">Appearance</span>
                <ThemeToggle />
              </div>
              <Button
                className="w-full justify-start gap-2 bg-[rgba(255,59,48,0.08)] text-[var(--apple-red)] hover:bg-[rgba(255,59,48,0.14)] border-0"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </Button>
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
          <div className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+4px)] left-4 right-4 z-50 md:hidden">
            <div className="apple-card p-2 space-y-1">
              {moreNav.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-all",
                      active
                        ? "bg-[rgba(0,122,255,0.12)] text-[var(--apple-blue)]"
                        : "text-[var(--text-primary)] hover:bg-[rgba(120,120,128,0.08)]"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
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
        <header className="flex items-center justify-between border-b border-[var(--separator)] px-4 py-3 md:hidden bg-[var(--glass-bg)] backdrop-blur-xl sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(120,120,128,0.10)] text-[var(--text-primary)] transition-all active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Image src="/spendwise-dark.png" alt="SpendWise" width={26} height={26} className="rounded-md dark:hidden" />
            <Image src="/spendwise-light.png" alt="SpendWise" width={26} height={26} className="rounded-md hidden dark:block" />
            <span className="text-[16px] font-bold tracking-[-0.3px] text-[var(--text-primary)]">SpendWise</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto pb-24 md:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">{children}</div>
        </div>

        {/* ─── Premium Mobile Bottom Tab Bar ─── */}
        <nav className="bottom-nav md:hidden">
          <div className="bottom-nav-inner">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              const Icon = active ? item.activeIcon : item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("bottom-nav-item", active && "active")}
                >
                  <div className="nav-icon-wrap">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-dot" />
                </Link>
              );
            })}
            {/* More button */}
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn("bottom-nav-item", (isMoreActive || moreOpen) && "active")}
            >
              <div className="nav-icon-wrap">
                {(isMoreActive || moreOpen) ? (
                  <IoEllipsisHorizontal className="h-6 w-6" />
                ) : (
                  <IoEllipsisHorizontalOutline className="h-6 w-6" />
                )}
              </div>
              <span className="nav-label">More</span>
              <span className="nav-dot" />
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}
