"use client";

import React, { useEffect, useState } from "react";
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
import { AlertCircle, Download, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  checkDatabaseSize,
  formatDatabaseSize,
  SUPABASE_FREE_TIER_BYTES,
  SUPABASE_STORAGE_WARNING_BYTES,
} from "@/lib/utils/db-health";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // States
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [newPassword, setNewPassword] = useState("");
  const [databaseSize, setDatabaseSize] = useState<number | null>(null);

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setName(user.user_metadata?.name || user.email?.split("@")[0] || "");
        setCurrency(user.user_metadata?.currency || "INR");
        setPaymentMethod(user.user_metadata?.paymentMethod || "cash");
      }

      const size = await checkDatabaseSize(supabase);
      setDatabaseSize(size);
      setLoading(false);
    };

    getUser();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { name },
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
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { currency, paymentMethod },
      });
      if (error) throw error;
      toast.success("Preferences updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences");
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
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const supabase = createClient();
      const [{ data: expenses }, { data: incomes }] = await Promise.all([
        supabase.from("expenses").select("*"),
        supabase.from("income").select("*"),
      ]);
      
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

  const handleClearData = async () => {
    if (!user) return;
    if (!confirm("Are you sure? This will permanently delete ALL your transactions and budgets. Your account will remain.")) {
      return;
    }
    setClearingData(true);
    try {
      const supabase = createClient();
      // Execute in parallel
      await Promise.all([
        supabase.from("expenses").delete().eq("user_id", user.id),
        supabase.from("income").delete().eq("user_id", user.id),
        supabase.from("budgets").delete().eq("user_id", user.id),
      ]);
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
      <div className="page-enter">
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

  return (
    <div className="page-enter">
      <PageHeader
        title="⚙️ Settings"
        description="Manage your account preferences and application settings"
      />

      <div className="max-w-2xl space-y-6">
        
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>👤 Profile</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>🎨 Preferences</CardTitle>
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
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
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
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSavePreferences} disabled={savingPrefs}>
              {savingPrefs ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
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
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword}>
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-[var(--apple-green)]" />
              Data Management
            </CardTitle>
            <CardDescription>Export your financial data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[14px] text-[var(--text-secondary)]">
              Download a copy of all your expenses and income as a CSV file.
            </p>
            <Button variant="outline" onClick={handleExportData} disabled={exporting}>
              {exporting ? "Exporting..." : "Export to CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* Database Health Section */}
        <Card>
          <CardHeader>
            <CardTitle>🗄️ Database Health</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>🌓 Theme</CardTitle>
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

        {/* Danger Zone */}
        <Card className="border-[rgba(255,59,48,0.2)]">
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
      </div>
    </div>
  );
}
