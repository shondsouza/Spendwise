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
import { AlertCircle } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [deleting, setDeleting] = useState(false);
  const [databaseSize, setDatabaseSize] = useState<number | null>(null);
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
      }

      const size = await checkDatabaseSize(supabase);
      setDatabaseSize(size);
      setLoading(false);
    };

    getUser();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { name },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Profile updated successfully!");
        // Refresh user data in state
        const {
          data: { user: updatedUser },
        } = await supabase.auth.getUser();
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error("No active user found");
      return;
    }

    if (
      !confirm("Are you sure? This will permanently delete all your data and cannot be undone.")
    ) {
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      await supabase.auth.admin.deleteUser(user.id);
      toast.success("Account deleted successfully");
      router.push("/auth/login");
    } catch {
      toast.error("Failed to delete account");
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
            <div key={i} className="apple-card h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isStorageNearLimit =
    databaseSize !== null && databaseSize > SUPABASE_STORAGE_WARNING_BYTES;

  return (
    <div className="page-enter">
      <PageHeader
        title="⚙️ Settings"
        description="Manage your account preferences and application settings"
      />

      <div className="max-w-2xl space-y-6">
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
              <Label htmlFor="name">Name (Display Only)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
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

            <Button>Save Preferences</Button>
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
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Deleting your account will permanently remove all your data. This action cannot be
                undone.
              </AlertDescription>
            </Alert>

            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full"
            >
              {deleting ? "Deleting..." : "Delete Account and All Data"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
