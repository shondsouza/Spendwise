"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, LogOut, Home, CreditCard, DollarSign, Handshake, Building2, TrendingUp, Target, Settings, FolderTree } from "lucide-react";
import { useTheme } from "next-themes";
import { Sidebar } from "@/components/shared/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const mainNav = [
  { href: "/dashboard", label: "Dashboard", emoji: "📊", icon: Home },
  { href: "/dashboard/expenses", label: "Expenses", emoji: "💳", icon: CreditCard },
  { href: "/dashboard/income", label: "Income", emoji: "💰", icon: DollarSign },
  { href: "/dashboard/lent", label: "Lent", emoji: "🤝", icon: Handshake },
  { href: "/dashboard/loan", label: "Loan", emoji: "🏦", icon: Building2 },
  { href: "/dashboard/analytics", label: "Analytics", emoji: "📈", icon: TrendingUp },
  { href: "/dashboard/budgets", label: "Budgets", emoji: "🎯", icon: Target },
  { href: "/dashboard/categories", label: "Categories", emoji: "📂", icon: FolderTree },
];

const bottomNav = [
  { href: "/dashboard/settings", label: "Settings", emoji: "⚙️", icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [userName, setUserName] = useState<string>("User");
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUserName(user.user_metadata?.name || user.email?.split("@")[0] || "User");
      }
      setIsLoading(false);
    };

    fetchUser();

    // Listen for auth state changes to update user name
    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split("@")[0] || "User");
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] p-6">
        <div className="w-full max-w-4xl space-y-6">
          <div className="h-9 w-56 animate-pulse rounded-xl bg-[rgba(120,120,128,0.12)]" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="apple-card h-36 animate-pulse" />
            ))}
          </div>
          <div className="apple-card h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar currentPath={pathname} userName={userName} onLogout={handleLogout} />
      
      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--separator)] bg-[rgba(246,246,248,0.98)] backdrop-blur-xl dark:bg-[rgba(28,28,30,0.98)] md:hidden">
            {/* Logo */}
            <div
              className="flex items-center justify-between gap-3 px-6 py-6"
              style={{ borderBottom: "1px solid var(--separator)" }}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={mounted ? (isDark ? "/spendwise-light.png" : "/spendwise-dark.png") : "/spendwise-dark.png"}
                  alt="SpendWise"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <span className="text-[17px] font-semibold tracking-[-0.2px] text-[var(--text-primary)]">
                  SpendWise
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5 text-[var(--text-secondary)]" />
              </button>
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
                      onClick={() => setMobileMenuOpen(false)}
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
                      onClick={() => setMobileMenuOpen(false)}
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
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </aside>
        </>
      )}

      <main className="flex flex-1 flex-col overflow-hidden md:ml-64">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-[var(--separator)] px-4 py-4 md:hidden">
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-6 w-6 text-[var(--text-primary)]" />
          </button>
          <div className="flex items-center gap-2">
            <Image
              src={mounted ? (isDark ? "/spendwise-light.png" : "/spendwise-dark.png") : "/spendwise-dark.png"}
              alt="SpendWise"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">
              SpendWise
            </span>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-[var(--separator)] bg-[var(--bg-primary)] py-2 md:hidden">
          {mainNav.slice(0, 5).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200",
                  active ? "text-[var(--apple-blue)]" : "text-[var(--text-tertiary)]"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
