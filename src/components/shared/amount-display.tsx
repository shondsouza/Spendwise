"use client";

import React, { useSyncExternalStore } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { DEFAULT_PREFERENCES, getPreferences, subscribePreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils/cn";

interface AmountDisplayProps {
  amount: number;
  className?: string;
  variant?: "default" | "success" | "danger";
}

export function AmountDisplay({ amount, className, variant = "default" }: AmountDisplayProps) {
  useSyncExternalStore(subscribePreferences, getPreferences, () => DEFAULT_PREFERENCES);
  const variantClasses = {
    default: "text-[var(--text-primary)]",
    success: "text-[var(--apple-green)]",
    danger: "text-[var(--apple-red)]",
  };

  return (
    <span
      className={cn(
        "amount font-mono tabular-nums font-semibold",
        variantClasses[variant],
        className
      )}
    >
      {formatCurrency(amount)}
    </span>
  );
}
