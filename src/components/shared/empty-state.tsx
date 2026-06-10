import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex h-96 flex-col items-center justify-center">
      <Icon className="h-12 w-12 text-[var(--text-tertiary)]" />
      <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.2px] text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mt-2 text-center text-[13px] text-[var(--text-secondary)]">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}
