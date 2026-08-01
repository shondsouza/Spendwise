import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 min-w-0">
        <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-[-0.8px] text-[var(--text-primary)] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[14px] text-[var(--text-secondary)] leading-relaxed tracking-[-0.1px]">
            {description}
          </p>
        )}
        {/* Gradient accent line */}
        <div
          className="mt-3 h-0.5 w-12 rounded-full"
          style={{ background: "var(--gradient-blue)" }}
        />
      </div>
      {action && (
        <div className="page-header-action flex flex-shrink-0 items-center gap-2.5">
          {action}
        </div>
      )}
    </div>
  );
}
