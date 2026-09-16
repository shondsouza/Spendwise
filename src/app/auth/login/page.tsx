"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const errorDescription = params.get("error_description");
    const errorCode = params.get("error_code");

    if (errorDescription) {
      toast.error(
        errorCode === "otp_expired"
          ? "This confirmation link has expired or was already used."
          : errorDescription
      );
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(
          error.message.toLowerCase().includes("email not confirmed")
            ? "Please confirm your email before signing in."
            : error.message
        );
      } else if (data.user) {
        toast.success("Logged in successfully!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Unable to sign in. Please try again.");
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
              Sign in to your SpendWise account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="pl-10 pr-10"
                />
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full" disabled={loading}>
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
            className="h-11 w-full"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            {loading ? "Starting guest session..." : "Continue as guest"}
          </Button>
        </div>
      </div>
    </div>
  );
}
