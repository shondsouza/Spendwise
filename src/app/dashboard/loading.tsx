import React from "react";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`skeleton rounded-3xl ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="page-enter space-y-8">
      <section className="dashboard-hero relative overflow-hidden rounded-[32px] border border-[var(--glass-border)] p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-10 w-72 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-3">
            <SkeletonBlock className="h-11 w-32 rounded-full" />
            <SkeletonBlock className="h-11 w-28 rounded-full" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-36" />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonBlock className="h-[320px] lg:col-span-2" />
          <SkeletonBlock className="h-[320px]" />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <SkeletonBlock className="h-4 w-44" />
          <SkeletonBlock className="h-4 w-28" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4">
              <SkeletonBlock className="h-10 w-48" />
              <SkeletonBlock className="h-10 w-24" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
