import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-[15px] font-semibold tracking-[-0.2px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,122,255,0.15)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-[var(--apple-blue)] text-white hover:bg-[#0071f0] hover:brightness-105",
        destructive:
          "bg-[rgba(255,59,48,0.1)] text-[var(--apple-red)] hover:bg-[rgba(255,59,48,0.16)]",
        outline:
          "border border-[var(--separator)] bg-[rgba(120,120,128,0.08)] text-[var(--text-primary)] hover:bg-[rgba(120,120,128,0.14)]",
        secondary:
          "bg-[rgba(120,120,128,0.12)] text-[var(--apple-blue)] hover:bg-[rgba(120,120,128,0.18)]",
        ghost: "text-[var(--text-secondary)] hover:bg-[rgba(120,120,128,0.12)] hover:text-[var(--text-primary)]",
        link: "text-[var(--apple-blue)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-[13px]",
        lg: "h-11 px-8",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
