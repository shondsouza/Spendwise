"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const errorDescription = params.get("error_description");
    const errorCode = params.get("error_code");

    if (errorDescription) {
      toast.error(
        errorCode === "otp_expired"
          ? "This confirmation link has expired or was already used. Request a new email."
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

    if (isCreateAccount && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isCreateAccount) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          toast.error(error.message);
        } else if (data.session) {
          toast.success("Account created successfully!");
          router.push("/dashboard");
        } else {
          setConfirmationSent(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
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
      }
    } catch {
      toast.error(
        isCreateAccount
          ? "Unable to create your account. Please try again."
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsCreateAccount((current) => !current);
    setPassword("");
    setConfirmPassword("");
    setConfirmationSent(false);
  };

  const resendConfirmation = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("A new confirmation email has been sent.");
      }
    } catch {
      toast.error("Unable to resend the confirmation email. Please try again.");
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
              {isCreateAccount ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
              {confirmationSent
                ? "Your account is almost ready."
                : isCreateAccount
                  ? "Create your SpendWise account with your email."
                  : "Sign in to your SpendWise account."}
            </p>
          </div>

          {confirmationSent ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-[var(--apple-blue)]/10 p-4 text-[13px] text-[var(--text-primary)]">
                We sent a confirmation link to <strong>{email}</strong>.
                Confirm your email, then return here to sign in.
              </div>
              <Button
                type="button"
                className="h-11 w-full"
                onClick={() => {
                  setConfirmationSent(false);
                  setIsCreateAccount(false);
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                Go to sign in
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={resendConfirmation}
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend confirmation email"}
              </Button>
              <p className="text-center text-[13px] text-[var(--text-secondary)]">
                Didn&apos;t receive the email? Check your spam folder or create
                the account again to request a new confirmation link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {isCreateAccount && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={loading}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

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
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                  autoComplete={isCreateAccount ? "new-password" : "current-password"}
                />
              </div>

              {isCreateAccount && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              )}

              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading
                  ? isCreateAccount
                    ? "Creating account..."
                    : "Signing in..."
                  : isCreateAccount
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>
          )}

          {!confirmationSent && (
            <p className="mt-6 text-center text-[13px] text-[var(--text-secondary)]">
              {isCreateAccount ? "Already have an account?" : "New to SpendWise?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="font-semibold text-[var(--apple-blue)] hover:underline"
              >
                {isCreateAccount ? "Sign in" : "Create account"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
