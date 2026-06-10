import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <h1 className="text-[34px] font-bold tracking-[-0.5px] text-[var(--text-primary)]">{title}</h1>
        {description && (
          <p className="mt-2 text-[15px] text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
