import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12">
      {/* Outer glow ring */}
      <div className="relative mb-6">
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{ background: "var(--gradient-blue)", transform: "scale(1.4)" }}
        />
        {/* Icon container */}
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-[28px] animate-bounce-subtle"
          style={{
            background: "var(--gradient-blue)",
            boxShadow: "0 8px 32px rgba(0, 122, 255, 0.25)",
          }}
        >
          <Icon className="h-9 w-9 text-white" strokeWidth={1.8} />
        </div>
      </div>

      <h3 className="text-[19px] font-bold tracking-[-0.4px] text-[var(--text-primary)] text-center">
        {title}
      </h3>
      <p className="mt-2 text-center text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-[260px]">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-all active:scale-95 hover:brightness-110"
          style={{ background: "var(--gradient-blue)", boxShadow: "0 4px 16px rgba(0, 122, 255, 0.3)" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
