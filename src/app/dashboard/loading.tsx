import React from "react";

function SkeletonBlock({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={`skeleton rounded-3xl ${className ?? ""}`} {...props} />;
}

export default function DashboardLoading() {
  return (
    <div className="page-enter space-y-6 sm:space-y-8" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading your SpendWise dashboard</span>

      <section className="dashboard-hero relative overflow-hidden rounded-[28px] border border-[var(--glass-border)] p-5 sm:rounded-[32px] sm:p-8">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[rgba(0,122,255,0.1)] blur-2xl" />
        <div className="relative mb-5 flex items-start justify-between gap-4 sm:mb-6 sm:items-end">
          <div className="min-w-0 space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-9 w-52 max-w-full sm:h-10 sm:w-72" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
          <SkeletonBlock className="h-11 w-11 flex-none rounded-full sm:h-11 sm:w-32" />
        </div>

        <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
          {[0, 1].map((index) => (
            <div key={index} className="rounded-[22px] border border-[var(--glass-border)] bg-[rgba(255,255,255,0.08)] p-4 sm:p-5">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="mt-3 h-6 w-24" />
              <SkeletonBlock className="mt-3 h-2.5 w-full" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 sm:rounded-3xl sm:p-5">
              <SkeletonBlock className="h-9 w-9 rounded-2xl" />
              <SkeletonBlock className="mt-4 h-3 w-16" />
              <SkeletonBlock className="mt-2 h-6 w-20" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="rounded-[26px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 sm:rounded-3xl sm:p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
          </div>
          <div className="flex h-40 items-end gap-2 sm:h-52 sm:gap-3">
            {[38, 58, 45, 74, 56, 82, 66].map((height, index) => (
              <SkeletonBlock key={index} className="flex-1 rounded-t-xl rounded-b-md" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
        <div className="hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 lg:block">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="mx-auto mt-8 h-36 w-36 rounded-full" />
          <SkeletonBlock className="mt-8 h-3 w-full" />
          <SkeletonBlock className="mt-3 h-3 w-4/5" />
        </div>
      </section>

      <section className="pb-3">
        <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-4 w-14" />
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3.5 sm:rounded-[24px] sm:p-4">
              <div className="flex min-w-0 items-center gap-3">
                <SkeletonBlock className="h-10 w-10 flex-none rounded-full" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-3 w-28 sm:w-40" />
                  <SkeletonBlock className="h-2.5 w-20 sm:w-28" />
                </div>
              </div>
              <SkeletonBlock className="h-4 w-16 flex-none sm:w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
