import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex min-h-11 w-full rounded-xl border border-transparent bg-[rgba(120,120,128,0.08)] px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-200 focus:border-[var(--apple-blue)] focus:bg-[var(--bg-secondary)] focus:outline-none focus:ring-4 focus:ring-[rgba(0,122,255,0.15)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[rgba(120,120,128,0.12)]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
