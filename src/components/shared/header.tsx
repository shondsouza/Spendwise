import React from "react";

interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <div
      className="px-6 py-5"
      style={{ borderBottom: "1px solid var(--separator)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-bold tracking-[-0.5px] text-[var(--text-primary)]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-[15px] text-[var(--text-secondary)]">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
