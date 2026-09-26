"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { toast } from "sonner";
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  ChevronDown,
  Database,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Gauge,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  Palette,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  UserRound,
  Vibrate,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  checkDatabaseSize,
  formatDatabaseSize,
  SUPABASE_FREE_TIER_BYTES,
  SUPABASE_STORAGE_WARNING_BYTES,
} from "@/lib/utils/db-health";
import { useGuestData } from "@/lib/guest-data";
import { PAYMENT_METHODS } from "@/lib/constants/config";
import {
  BUDGET_ALERT_PERCENTS,
  CURRENCIES,
  DATE_FORMATS,
  DEFAULT_PREFERENCES,
  getPreferences,
  normalizePaymentMethod,
  savePreferences,
  subscribePreferences,
  type DateFormatId,
} from "@/lib/preferences";
import { formatCurrency } from "@/lib/utils/currency";

function SettingSwitch({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={`relative h-8 w-[52px] flex-none rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--apple-blue)] ${
        checked ? "bg-[var(--apple-blue)]" : "bg-[rgba(120,120,128,0.28)]"
      }`}
    >
      <span
        className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-all duration-200"
        style={{ left: checked ? "calc(100% - 28px)" : "4px" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // States
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [dateFormat, setDateFormat] = useState<DateFormatId>("pretty");
  const prefs = useSyncExternalStore(subscribePreferences, getPreferences, () => DEFAULT_PREFERENCES);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [databaseSize, setDatabaseSize] = useState<number | null>(null);

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const guestData = useGuestData();

  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setName(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            ""
        );
        setCurrency(user.user_metadata?.currency || getPreferences().currency || "INR");
        setPaymentMethod(normalizePaymentMethod(user.user_metadata?.paymentMethod || getPreferences().paymentMethod));
        setDateFormat(
          DATE_FORMATS.some((item) => item.value === user.user_metadata?.dateFormat)
            ? user.user_metadata.dateFormat
            : getPreferences().dateFormat
        );
      }

      const size = guestData.isGuest ? null : await checkDatabaseSize(supabase);
      setDatabaseSize(size);
      setLoading(false);
    };

    getUser();
  }, [guestData.isGuest]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name.trim(), name: name.trim() },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Profile updated successfully!");
        const { data: { user: updatedUser } } = await supabase.auth.getUser();
        if (updatedUser) setUser(updatedUser);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSavingPrefs(true);
    try {
      await savePreferences({ currency: currency as (typeof CURRENCIES)[number]["code"], paymentMethod, dateFormat });
      toast.success("Preferences updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const supabase = createClient();
      const [{ data: expenses }, { data: incomes }] = guestData.isGuest
        ? [{ data: guestData.expenses }, { data: guestData.income }]
        : await Promise.all([supabase.from("expenses").select("*"), supabase.from("income").select("*")]);
      
      const allData = [
        ...(expenses || []).map(e => ({ ...e, record_type: 'expense' })),
        ...(incomes || []).map(i => ({ ...i, record_type: 'income' }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (allData.length === 0) {
        toast.info("No data to export");
        return;
      }

      const headers = ["date", "record_type", "title", "amount", "category", "payment_method", "description"];
      const csvContent = [
        headers.join(","),
        ...allData.map(row => 
          headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(",")
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `spendwise_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = async () => {
    setExportingJson(true);
    try {
      const supabase = createClient();
      let expenses = guestData.expenses;
      let income = guestData.income;
      let budgets = guestData.budgets;
      let categories = guestData.categories;
      if (!guestData.isGuest) {
        const [expenseResult, incomeResult, budgetResult, categoryResult] = await Promise.all([
          supabase.from("expenses").select("*"),
          supabase.from("income").select("*"),
          supabase.from("budgets").select("*"),
          supabase.from("categories").select("*"),
        ]);
        const failed = [expenseResult, incomeResult, budgetResult, categoryResult].find((result) => result.error);
        if (failed?.error) throw failed.error;
        expenses = expenseResult.data ?? [];
        income = incomeResult.data ?? [];
        budgets = budgetResult.data ?? [];
        categories = categoryResult.data ?? [];
      }

      const total = expenses.length + income.length + budgets.length + categories.length;
      if (total === 0) {
        toast.info("No data to export");
        return;
      }

      const payload = {
        exported_at: new Date().toISOString(),
        expenses,
        income,
        budgets,
        categories,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `spendwise_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (err) {
      console.error("JSON export error:", err);
      toast.error("Failed to export backup");
    } finally {
      setExportingJson(false);
    }
  };

  const handleToggle = async (partial: Parameters<typeof savePreferences>[0]) => {
    try {
      await savePreferences(partial);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save setting");
    }
  };

  const handleReplayTour = () => {
    window.localStorage.removeItem("spendwise-guide-shown");
    window.dispatchEvent(new Event("spendwise-replay-tour"));
    toast.success("Tour started");
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch {
      toast.error("Failed to sign out");
      setSigningOut(false);
    }
  };

  const handleClearData = async () => {
    if (!user) return;
    if (!confirm("Are you sure? This will permanently delete ALL your transactions and budgets. Your account will remain.")) {
      return;
    }
    setClearingData(true);
    try {
      if (guestData.isGuest) {
        guestData.deleteAll();
      } else {
        const supabase = createClient();
        await Promise.all([
          supabase.from("expenses").delete().eq("user_id", user.id),
          supabase.from("income").delete().eq("user_id", user.id),
          supabase.from("budgets").delete().eq("user_id", user.id),
        ]);
      }
      toast.success("All data cleared successfully");
    } catch (err) {
      console.error("Clear data error:", err);
      toast.error("Failed to clear data");
    } finally {
      setClearingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error("No active user found");
      return;
    }
    if (!confirm("Are you sure? This will permanently delete all your data and cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      const supabase = createClient();
      await supabase.auth.admin.deleteUser(user.id);
      toast.success("Account deleted successfully");
      router.push("/auth/login");
    } catch {
      toast.error("Failed to delete account (Requires Admin API Key). Consider soft clearing data instead.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page page-enter">
        <PageHeader title="⚙️ Settings" description="Manage your account preferences" />
        <div className="max-w-2xl space-y-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="apple-card h-40 animate-pulse bg-[var(--bg-secondary)]" />
          ))}
        </div>
      </div>
    );
  }

  const isStorageNearLimit = databaseSize !== null && databaseSize > SUPABASE_STORAGE_WARNING_BYTES;
  const displayName = name || user?.email?.split("@")[0] || "SpendWise member";
  const accountInitial = displayName.trim().charAt(0).toUpperCase();
  const memberSince = user?.created_at
    ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(user.created_at))
    : null;

  return (
    <div className="page-enter">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account, preferences, and data in one place"
      />

      <div className="max-w-4xl space-y-6">
        <section className="settings-hero relative overflow-hidden rounded-[28px] border p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgba(0,122,255,0.13)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-[rgba(175,82,222,0.08)] blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="flex h-16 w-16 flex-none items-center justify-center rounded-[22px] text-[25px] font-extrabold text-white shadow-[0_10px_22px_rgba(0,122,255,0.25)]"
                style={{ background: "var(--gradient-blue)" }}
              >
                {accountInitial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate text-[21px] font-extrabold tracking-[-0.5px] text-[var(--text-primary)]">{displayName}</h2>
                  {user?.email_confirmed_at && <BadgeCheck className="h-4 w-4 flex-none text-[var(--apple-blue)]" aria-label="Verified account" />}
                </div>
                <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-[var(--text-secondary)]"><Mail className="h-3.5 w-3.5 flex-none" />{user?.email}</p>
                {memberSince && <p className="mt-1 text-[11px] font-medium text-[var(--text-tertiary)]">Member since {memberSince}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:min-w-[210px]">
              <div className="rounded-2xl border border-[rgba(0,122,255,0.12)] bg-[rgba(0,122,255,0.06)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.45px] text-[var(--apple-blue)]">Currency</p>
                <p className="mt-0.5 text-[15px] font-bold text-[var(--text-primary)]">{currency}</p>
              </div>
              <div className="rounded-2xl border border-[rgba(52,199,89,0.12)] bg-[rgba(52,199,89,0.06)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.45px] text-[var(--apple-green)]">Default pay</p>
                <p className="mt-0.5 truncate text-[15px] font-bold capitalize text-[var(--text-primary)]">{paymentMethod}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Profile Section */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(0,122,255,0.1)]"><UserRound className="h-4 w-4 text-[var(--apple-blue)]" /></span>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="opacity-60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(175,82,222,0.1)]"><Palette className="h-4 w-4 text-[var(--apple-purple)]" /></span>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Default Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_format">Date format</Label>
              <Select value={dateFormat} onValueChange={(value) => setDateFormat(value as DateFormatId)}>
                <SelectTrigger id="date_format">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSavePreferences} disabled={savingPrefs}>
              {savingPrefs ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Section */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--apple-blue)]" />
              Security
            </CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <button
                  type="button"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowNewPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword}>
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-[var(--apple-green)]" />
              Data Management
            </CardTitle>
            <CardDescription>Export your financial data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[14px] text-[var(--text-secondary)]">
              Download expenses and income as a spreadsheet, or a JSON backup that also includes budgets and categories.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportData} disabled={exporting || exportingJson}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exporting..." : "Export CSV"}
              </Button>
              <Button variant="outline" onClick={handleExportJson} disabled={exporting || exportingJson}>
                <FileJson className="mr-2 h-4 w-4" />
                {exportingJson ? "Exporting..." : "Export JSON"}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
        {/* Database Health Section */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(90,200,250,0.12)]"><Database className="h-4 w-4 text-[var(--apple-teal)]" /></span>Database Health</CardTitle>
            <CardDescription>Supabase free tier storage usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {databaseSize === null ? (
              <p className="text-[13px] text-[var(--text-secondary)]">
                Run `supabase/schema.sql` in Supabase SQL Editor to enable the health check.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">Current usage</span>
                  <span className="font-mono tabular-nums font-semibold">
                    {formatDatabaseSize(databaseSize)} /{" "}
                    {formatDatabaseSize(SUPABASE_FREE_TIER_BYTES)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(120,120,128,0.12)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isStorageNearLimit ? "bg-[var(--apple-orange)]" : "bg-[var(--apple-green)]"
                    }`}
                    style={{ width: `${Math.min((databaseSize / SUPABASE_FREE_TIER_BYTES) * 100, 100)}%` }}
                  />
                </div>
                {isStorageNearLimit && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Storage is above 400 MB. Export old data and delete records you no longer
                      need to stay under the Supabase free tier limit.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Theme Section */}
        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(88,86,214,0.1)]"><Moon className="h-4 w-4 text-[var(--apple-indigo)]" /></span>Appearance</CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-medium text-[var(--text-primary)]">Dark Mode</p>
              <p className="text-[13px] text-[var(--text-secondary)]">
                Choose between light and dark theme
              </p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="settings-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(255,149,0,0.12)]">
                  <SlidersHorizontal className="h-4 w-4 text-[var(--apple-orange)]" />
                </span>
                Display
              </CardTitle>
              <CardDescription>How amounts show up across SpendWise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-medium text-[var(--text-primary)]">Hide amounts</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">Mask balances when someone is nearby</p>
                </div>
                <SettingSwitch
                  label="Hide amounts"
                  checked={prefs.hideAmounts}
                  onCheckedChange={(checked) => handleToggle({ hideAmounts: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-medium text-[var(--text-primary)]">Show decimals</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">Keep paise and cents visible</p>
                </div>
                <SettingSwitch
                  label="Show decimals"
                  checked={prefs.showDecimals}
                  onCheckedChange={(checked) => handleToggle({ showDecimals: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-medium text-[var(--text-primary)]">Compact numbers</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">Shorten large amounts, like ₹1.2L</p>
                </div>
                <SettingSwitch
                  label="Compact numbers"
                  checked={prefs.compactNumbers}
                  onCheckedChange={(checked) => handleToggle({ compactNumbers: checked })}
                />
              </div>
              <div className="rounded-2xl border border-[var(--separator)] bg-[rgba(120,120,128,0.05)] px-3 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.4px] text-[var(--text-tertiary)]">Preview</p>
                <p className="mt-1 font-mono text-[18px] font-bold text-[var(--text-primary)]">
                  {formatCurrency(125430.5, {
                    currency: currency as (typeof CURRENCIES)[number]["code"],
                    hideAmounts: prefs.hideAmounts,
                    showDecimals: prefs.showDecimals,
                    compactNumbers: prefs.compactNumbers,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="settings-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(255,59,48,0.1)]">
                  <Bell className="h-4 w-4 text-[var(--apple-red)]" />
                </span>
                Budget alerts
              </CardTitle>
              <CardDescription>Highlight a category as it approaches its limit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-medium text-[var(--text-primary)]">Warn before overspending</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">Budgets turn amber at your chosen threshold</p>
                </div>
                <SettingSwitch
                  label="Warn before overspending"
                  checked={prefs.budgetAlerts}
                  onCheckedChange={(checked) => handleToggle({ budgetAlerts: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_alert">Alert when spending reaches</Label>
                <Select
                  value={String(prefs.budgetAlertPercent)}
                  onValueChange={(value) => handleToggle({ budgetAlertPercent: Number(value) })}
                  disabled={!prefs.budgetAlerts}
                >
                  <SelectTrigger id="budget_alert">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_ALERT_PERCENTS.map((percent) => (
                      <SelectItem key={percent} value={String(percent)}>
                        {percent}% of the budget
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(52,199,89,0.12)]">
                <Gauge className="h-4 w-4 text-[var(--apple-green)]" />
              </span>
              App behavior
            </CardTitle>
            <CardDescription>Feedback, safety checks, and this session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-medium text-[var(--text-primary)]">Ask before deleting</p>
                <p className="text-[13px] text-[var(--text-secondary)]">Confirm when you remove a transaction, budget, or loan</p>
              </div>
              <SettingSwitch
                label="Ask before deleting"
                checked={prefs.confirmBeforeDelete}
                onCheckedChange={(checked) => handleToggle({ confirmBeforeDelete: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-2">
                <Vibrate className="mt-0.5 h-4 w-4 flex-none text-[var(--text-tertiary)]" />
                <div>
                  <p className="text-[15px] font-medium text-[var(--text-primary)]">Haptic feedback</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">Vibrate on supported phones</p>
                </div>
              </div>
              <SettingSwitch
                label="Haptic feedback"
                checked={prefs.haptics}
                onCheckedChange={(checked) => handleToggle({ haptics: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-medium text-[var(--text-primary)]">Reduce motion</p>
                <p className="text-[13px] text-[var(--text-secondary)]">Turn off page and card animations</p>
              </div>
              <SettingSwitch
                label="Reduce motion"
                checked={prefs.reduceMotion}
                onCheckedChange={(checked) => handleToggle({ reduceMotion: checked })}
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-[var(--separator)] pt-4 sm:flex-row">
              <Button variant="outline" onClick={handleReplayTour} className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Replay welcome tour
              </Button>
              <Button variant="outline" onClick={handleSignOut} disabled={signingOut} className="flex-1">
                <LogOut className="mr-2 h-4 w-4" />
                {signingOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          aria-expanded={showDangerZone}
          aria-controls="settings-danger-zone"
          onClick={() => setShowDangerZone((visible) => !visible)}
          className="w-full justify-between text-[var(--apple-red)]"
        >
          {showDangerZone ? "Hide Danger Zone" : "Show Danger Zone"}
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 transition-transform ${showDangerZone ? "rotate-180" : ""}`}
          />
        </Button>

        {showDangerZone && (
          <Card id="settings-danger-zone" className="settings-card border-[rgba(255,59,48,0.2)]">
            <CardHeader>
              <CardTitle className="text-[var(--apple-red)]">🚨 Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-[15px] font-semibold text-[var(--text-primary)]">Clear All Data</h4>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  Permanently delete all your transactions, categories, and budgets. Your account will remain active.
                </p>
                <Button
                  variant="outline"
                  onClick={handleClearData}
                  disabled={clearingData}
                  className="w-full text-[var(--apple-orange)] border-[rgba(255,149,0,0.3)] hover:bg-[rgba(255,149,0,0.1)]"
                >
                  {clearingData ? "Clearing..." : "Soft Reset (Clear Data)"}
                </Button>
              </div>

              <div className="h-px bg-[var(--separator)] w-full" />

              <div className="space-y-3">
                <h4 className="text-[15px] font-semibold text-[var(--apple-red)]">Delete Account</h4>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full"
                >
                  {deleting ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
