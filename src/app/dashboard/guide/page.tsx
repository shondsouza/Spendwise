import React from "react";
import { BarChart3, BookOpen, CircleDollarSign, Lightbulb, ListChecks, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

const steps = [
  {
    icon: CircleDollarSign,
    title: "Record your expenses",
    text: "Use Add expense to record what you spent, including the description, amount, category, date, payment method, and optional notes.",
  },
  {
    icon: WalletCards,
    title: "Add your income",
    text: "Record salary, freelance payments, gifts, or any other money received. Keeping income updated makes your balance more useful.",
  },
  {
    icon: ListChecks,
    title: "Organize your money",
    text: "Create categories that match your life, then use budgets to set monthly spending limits for important categories.",
  },
  {
    icon: BarChart3,
    title: "Review your progress",
    text: "Check the dashboard for your balance and recent activity. Use Analytics to understand spending patterns and compare months.",
  },
];

export default function GuidePage() {
  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="How to use SpendWise"
        description="A simple guide to tracking your finances consistently"
      />

      <section className="rounded-[28px] border border-[rgba(0,122,255,0.14)] bg-[rgba(0,122,255,0.06)] p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[var(--apple-blue)] text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[19px] font-bold text-[var(--text-primary)]">
              Start with today
            </h2>
            <p className="mt-1 text-[14px] leading-6 text-[var(--text-secondary)]">
              Add every expense and income as soon as possible. Accurate,
              consistent entries give you a clear picture of where your money
              goes.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <article
              key={step.title}
              className="apple-card flex gap-4 border border-[var(--separator)] p-5"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[rgba(120,120,128,0.1)] text-[var(--apple-blue)]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.4px] text-[var(--text-tertiary)]">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-[16px] font-bold text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-5 text-[var(--text-secondary)]">
                  {step.text}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="apple-card border border-[var(--separator)] p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 flex-none text-[var(--apple-orange)]" />
          <div>
            <h2 className="text-[17px] font-bold text-[var(--text-primary)]">
              Good habits
            </h2>
            <ul className="mt-3 space-y-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              <li>• Review your dashboard at the end of each day.</li>
              <li>• Use the same category for similar transactions.</li>
              <li>• Set a budget before the month begins.</li>
              <li>• Check Analytics weekly and adjust your spending.</li>
              <li>• Update your profile and preferred currency in Settings.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
