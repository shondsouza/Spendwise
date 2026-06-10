import React from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

interface AmountDisplayProps {
  amount: number;
  className?: string;
  variant?: "default" | "success" | "danger";
}

export function AmountDisplay({ amount, className, variant = "default" }: AmountDisplayProps) {
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
