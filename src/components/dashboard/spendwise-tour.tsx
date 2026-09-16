"use client";

import { useState } from "react";
import Image from "next/image";
import { BarChart3, CircleDollarSign, ListChecks, WalletCards, X } from "lucide-react";

const steps = [
  {
    icon: CircleDollarSign,
    title: "Track expenses",
    text: "Use the Add button to record what you spend, with a category, date, and payment method.",
    image: "/wallet.jpg",
  },
  {
    icon: WalletCards,
    title: "Record income",
    text: "Add salary, freelance payments, or any other income to keep your balance accurate.",
    image: "/spendwise.png",
  },
  {
    icon: ListChecks,
    title: "Plan your money",
    text: "Create categories and set budgets to organize your spending and stay on track.",
    image: "/spendwise-light.png",
  },
  {
    icon: BarChart3,
    title: "Understand your finances",
    text: "Review the dashboard and Analytics to see patterns and make better decisions.",
    image: "/logo/desktop.png",
  },
];

export function SpendwiseTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLastStep = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="spendwise-tour-title"
        className="relative w-full max-w-md rounded-[28px] border border-[var(--separator)] bg-[var(--bg-primary)] p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          aria-label="Close SpendWise tour"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[var(--text-secondary)] hover:bg-[rgba(120,120,128,0.1)]"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--apple-blue)]">
          SpendWise tour
        </p>
        <div className="relative mt-4 h-36 overflow-hidden rounded-2xl bg-[rgba(120,120,128,0.08)]">
          <Image
            src={current.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-contain p-5"
          />
        </div>
        <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(0,122,255,0.12)] text-[var(--apple-blue)]">
          <Icon className="h-7 w-7" />
        </div>
        <h2 id="spendwise-tour-title" className="mt-5 text-2xl font-bold text-[var(--text-primary)]">
          {current.title}
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">{current.text}</p>

        <div className="mt-6 flex gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((item, index) => (
            <span
              key={item.title}
              className={`h-1.5 flex-1 rounded-full ${
                index <= step ? "bg-[var(--apple-blue)]" : "bg-[rgba(120,120,128,0.18)]"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Skip tour
          </button>
          <button
            type="button"
            onClick={() => (isLastStep ? onClose() : setStep((value) => value + 1))}
            className="rounded-xl bg-[var(--apple-blue)] px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            {isLastStep ? "Get started" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}
