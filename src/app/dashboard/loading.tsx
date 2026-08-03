const pulseItems = [0, 1, 2];
const statCards = [0, 1, 2, 3];

export default function DashboardLoading() {
  return (
    <div className="dashboard-app-shell relative min-h-dvh overflow-hidden px-4 py-6 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-[rgba(0,122,255,0.14)] blur-3xl motion-safe:animate-pulse" />
        <div className="absolute right-[-60px] top-28 h-48 w-48 rounded-full bg-[rgba(88,86,214,0.14)] blur-3xl motion-safe:animate-pulse" />
        <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-[rgba(52,199,89,0.1)] blur-3xl motion-safe:animate-pulse" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="dashboard-hero apple-card overflow-hidden rounded-[28px] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="skeleton h-4 w-40 rounded-full" />
              <div className="skeleton h-9 w-64 rounded-2xl" />
              <div className="skeleton h-4 w-52 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              {pulseItems.map((item) => (
                <span
                  key={item}
                  className="h-2 w-2 rounded-full bg-[var(--apple-blue)] opacity-70 motion-safe:animate-bounce-subtle"
                  style={{ animationDelay: `${item * 140}ms` }}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card}
              className="apple-card card rounded-[24px] p-5"
              style={{ animationDelay: `${card * 70}ms` }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="skeleton h-3 w-20 rounded-full" />
                <div className="skeleton h-8 w-8 rounded-full" />
              </div>
              <div className="skeleton h-8 w-28 rounded-xl" />
              <div className="mt-4 skeleton h-3 w-24 rounded-full" />
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="apple-card card rounded-[26px] p-6 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div className="skeleton h-4 w-36 rounded-full" />
              <div className="skeleton h-8 w-20 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
            </div>
          </article>

          <article className="apple-card card rounded-[26px] p-6">
            <div className="mb-5 skeleton h-4 w-28 rounded-full" />
            <div className="space-y-4">
              <div className="skeleton h-16 rounded-2xl" />
              <div className="skeleton h-16 rounded-2xl" />
              <div className="skeleton h-16 rounded-2xl" />
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
