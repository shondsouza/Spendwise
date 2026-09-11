"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        toast.success("Logged in successfully!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        toast.success("Guest session started!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Unable to start a guest session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="apple-card overflow-hidden border border-[var(--separator)] shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="p-6 sm:p-8">
          <div className="mb-7">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Welcome back
            </h2>
            <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
              Sign in to continue to your SpendWise account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--text-secondary)] transition-colors hover:bg-[rgba(120,120,128,0.1)] hover:text-[var(--text-primary)]"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="mt-2 h-11 w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--separator)]" />
            <span className="text-xs text-[var(--text-tertiary)]">or</span>
            <div className="h-px flex-1 bg-[var(--separator)]" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            <UserRound className="h-4 w-4" />
            Continue as guest
          </Button>
        </div>
      </div>
    </div>
  );
}
