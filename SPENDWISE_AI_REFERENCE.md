# 🍎 SpendWise — AI Reference Guide

> **Read this file before making ANY change to the codebase.**  
> This is the single source of truth for architecture, design, and coding standards.

---

## 📌 Table of Contents

1. [Project Identity](#1-project-identity)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema](#4-database-schema)
5. [Design System — Apple HIG](#5-design-system--apple-hig)
6. [Coding Standards](#6-coding-standards)
7. [Component Patterns](#7-component-patterns)
8. [Server Actions Pattern](#8-server-actions-pattern)
9. [Data Fetching Rules](#9-data-fetching-rules)
10. [Emoji System](#10-emoji-system)
11. [Pages & Features](#11-pages--features)
12. [Environment Variables](#12-environment-variables)
13. [DO NOTs — Hard Rules](#13-do-nots--hard-rules)
14. [Checklist Before Every Change](#14-checklist-before-every-change)

---

## 1. Project Identity

| Field             | Value                                                        |
| ----------------- | ------------------------------------------------------------ |
| **App Name**      | SpendWise                                                    |
| **Purpose**       | Personal daily expense tracker                               |
| **Currency**      | Indian Rupee — ₹ (INR) always                                |
| **Target Feel**   | macOS Sequoia + iOS 18 Wallet — premium, clean, Apple-native |
| **Primary Users** | Individual users managing personal finances                  |

---

## 2. Tech Stack

### ✅ Approved Technologies Only

| Layer        | Technology            | Version   | Notes                                  |
| ------------ | --------------------- | --------- | -------------------------------------- |
| Framework    | Next.js               | 15.x      | App Router only, no Pages Router       |
| UI Library   | React                 | 18.x      | Server Components first                |
| Language     | TypeScript            | 5.x       | Strict mode, zero `any`                |
| Styling      | Tailwind CSS          | 3.4.x     | Utility classes only, no inline styles |
| Components   | shadcn/ui + Radix UI  | latest    | All UI primitives                      |
| Charts       | Recharts              | 2.x       | Apple-styled, no grid lines            |
| Forms        | React Hook Form + Zod | 7.x / 3.x | All forms, all validation              |
| Icons        | Lucide React          | latest    | Icons only, emojis for categories      |
| Fonts        | SF Pro (system-ui)    | —         | See font stack below                   |
| Theme        | next-themes           | latest    | Dark/Light/System                      |
| Date utils   | date-fns              | 3.x       | No moment.js, no dayjs                 |
| URL state    | nuqs                  | latest    | Filter state in URL                    |
| Backend      | Supabase              | latest    | PostgreSQL + Auth + Realtime           |
| Auth helpers | @supabase/ssr         | latest    | Server-side auth only                  |
| Animations   | Tailwind + CSS        | —         | No Framer Motion unless asked          |

### ❌ Never Add These

- `axios` — use native `fetch`
- `moment.js` or `dayjs` — use `date-fns`
- `styled-components` or `emotion` — use Tailwind
- `react-query` or `SWR` — use Server Components + Server Actions
- `redux` or `zustand` — use React state + URL state (nuqs)
- `framer-motion` — use CSS animations unless explicitly asked
- Any `useEffect` for data fetching

---

## 3. Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + Header shell
│   │   ├── page.tsx                # Dashboard
│   │   ├── expenses/page.tsx
│   │   ├── income/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── budgets/page.tsx
│   │   └── settings/page.tsx
│   ├── actions/
│   │   ├── expense.actions.ts      # Server Actions ONLY
│   │   ├── income.actions.ts
│   │   ├── budget.actions.ts
│   │   └── auth.actions.ts
│   ├── layout.tsx                  # Root layout + providers
│   └── providers.tsx
│
├── components/
│   ├── ui/                         # shadcn/ui — DO NOT modify manually
│   ├── dashboard/
│   │   ├── summary-cards.tsx
│   │   ├── recent-transactions.tsx
│   │   ├── spending-chart.tsx
│   │   └── budget-overview.tsx
│   ├── expenses/
│   │   ├── expense-table.tsx
│   │   ├── expense-filters.tsx
│   │   ├── add-expense-dialog.tsx
│   │   └── expense-category-chart.tsx
│   ├── income/
│   │   ├── income-table.tsx
│   │   └── add-income-dialog.tsx
│   ├── analytics/
│   │   ├── monthly-trend-chart.tsx
│   │   ├── category-breakdown.tsx
│   │   └── daily-heatmap.tsx
│   ├── budgets/
│   │   ├── budget-card.tsx
│   │   └── add-budget-dialog.tsx
│   └── shared/
│       ├── sidebar.tsx
│       ├── header.tsx
│       ├── page-header.tsx
│       ├── data-table.tsx
│       ├── amount-display.tsx
│       ├── category-badge.tsx
│       └── empty-state.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server Supabase client
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── expense.schema.ts
│   │   ├── income.schema.ts
│   │   └── budget.schema.ts
│   ├── constants/
│   │   ├── categories.ts          # All category definitions
│   │   └── config.ts
│   └── utils/
│       ├── currency.ts            # ₹ formatting always here
│       ├── date.ts
│       └── cn.ts
│
├── hooks/
│   ├── use-expenses.ts
│   ├── use-realtime.ts
│   ├── use-budget-progress.ts
│   └── use-toast.ts
│
├── types/
│   ├── expense.types.ts
│   ├── income.types.ts
│   ├── budget.types.ts
│   └── supabase.types.ts
│
└── middleware.ts
```

### 📏 File Naming Rules

- All files: `kebab-case.tsx` or `kebab-case.ts`
- No `index.tsx` files (use explicit names)
- Server Actions file suffix: `.actions.ts`
- Zod schemas file suffix: `.schema.ts`
- Type files suffix: `.types.ts`
- Hooks prefix: `use-`

---

## 4. Database Schema

### Tables

#### `expenses`

```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
title           TEXT NOT NULL
amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0)
category        TEXT NOT NULL
date            DATE NOT NULL DEFAULT CURRENT_DATE
notes           TEXT
payment_method  TEXT DEFAULT 'Cash'  -- 'Cash' | 'UPI' | 'Card' | 'Bank Transfer'
is_recurring    BOOLEAN DEFAULT false
tags            TEXT[]
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

#### `income`

```sql
id          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
title       TEXT NOT NULL
amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0)
category    TEXT NOT NULL
date        DATE NOT NULL DEFAULT CURRENT_DATE
notes       TEXT
source      TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
updated_at  TIMESTAMPTZ DEFAULT NOW()
```

#### `budgets`

```sql
id          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
category    TEXT NOT NULL
amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0)
period      TEXT NOT NULL DEFAULT 'monthly'  -- 'monthly' | 'weekly'
start_date  DATE NOT NULL
end_date    DATE NOT NULL
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### Security Rules

- ✅ RLS enabled on ALL tables — no exceptions
- ✅ All policies: `auth.uid() = user_id`
- ✅ No public read access on any table
- ✅ Indexes on `(user_id, date DESC)` and `(user_id, category)`

---

## 5. Design System — Apple HIG

### 🔤 Font Stack

```css
/* In globals.css — load from cdnfonts */
@import url("https://fonts.cdnfonts.com/css/sf-pro-display");

font-family:
  "SF Pro Display",
  /* headings */ "SF Pro Text",
  /* body */ "SF Pro Rounded",
  /* badges, numbers */ -apple-system,
  BlinkMacSystemFont,
  system-ui,
  sans-serif;

/* Amounts always use */
font-family: "SF Mono", ui-monospace, monospace;
```

### Typography Scale

| Token       | Size | Weight | Tracking | Use             |
| ----------- | ---- | ------ | -------- | --------------- |
| Large Title | 34px | 700    | -0.5px   | Page titles     |
| Title 2     | 22px | 600    | -0.3px   | Section headers |
| Headline    | 17px | 600    | -0.2px   | Card titles     |
| Body        | 15px | 400    | 0px      | General text    |
| Footnote    | 13px | 400    | 0.1px    | Captions, meta  |
| Caption     | 11px | 500    | 0.5px    | Labels, badges  |

### 🎨 Color Tokens

```css
:root {
  /* Backgrounds */
  --bg-primary: #f5f5f7;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f2f2f7;
  --bg-card: rgba(255, 255, 255, 0.72);

  /* Text */
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --text-tertiary: #aeaeb2;

  /* Apple System Colors */
  --apple-blue: #007aff; /* primary action */
  --apple-green: #34c759; /* income, success */
  --apple-red: #ff3b30; /* expense, danger */
  --apple-orange: #ff9500; /* warning */
  --apple-yellow: #ffcc00; /* caution */
  --apple-purple: #af52de; /* premium */
  --apple-pink: #ff2d55; /* accent */
  --apple-teal: #5ac8fa; /* info */
  --apple-indigo: #5856d6; /* deep accent */

  /* Borders */
  --separator: rgba(60, 60, 67, 0.12);
  --border: rgba(60, 60, 67, 0.18);

  /* Glass */
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(255, 255, 255, 0.5);
}

.dark {
  --bg-primary: #000000; /* OLED true black */
  --bg-secondary: #1c1c1e;
  --bg-tertiary: #2c2c2e;
  --bg-card: rgba(28, 28, 30, 0.85);

  --text-primary: #f5f5f7;
  --text-secondary: rgba(235, 235, 245, 0.8);
  --text-tertiary: rgba(235, 235, 245, 0.6);

  --separator: rgba(84, 84, 88, 0.55);
  --border: rgba(84, 84, 88, 0.65);

  --glass-bg: rgba(28, 28, 30, 0.85);
  --glass-border: rgba(255, 255, 255, 0.08);
}
```

### 🪟 Glass Cards

```css
.apple-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 8px 24px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.apple-card:hover {
  transform: translateY(-1px);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 16px 40px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
```

### 📐 Border Radius Scale

| Element          | Radius       |
| ---------------- | ------------ |
| Buttons / Pills  | 980px (full) |
| Cards            | 20px         |
| Inner elements   | 12px         |
| Badges / Tags    | 8px          |
| Inputs           | 12px         |
| Modals / Dialogs | 20px         |

### 📏 Spacing (8pt grid — never deviate)

| Token | Value |
| ----- | ----- |
| xs    | 4px   |
| sm    | 8px   |
| md    | 16px  |
| lg    | 24px  |
| xl    | 32px  |
| 2xl   | 48px  |
| 3xl   | 64px  |

### 🎞️ Animation Curves

```css
--ease-spring: cubic-bezier(0.25, 0.46, 0.45, 0.94); /* standard */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* open/appear */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1); /* exit */
```

Page enter animation:

```css
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 📊 Chart Colors (in order)

```js
[
  "#007aff",
  "#34c759",
  "#ff9500",
  "#ff3b30",
  "#af52de",
  "#ff2d55",
  "#5ac8fa",
  "#ffcc00",
  "#5856d6",
  "#ff6b35",
];
```

Chart rules:

- No grid lines (or `rgba(0,0,0,0.04)` max)
- Rounded bar corners: `radius={[6, 6, 0, 0]}`
- Smooth lines: `type="monotone"`
- Tooltip styled as glass card
- Dots on hover only

---

## 6. Coding Standards

### TypeScript Rules

```ts
// ✅ CORRECT
interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
}

// ❌ WRONG — never use any
const data: any = response;

// ✅ Infer Server Action return types
type AddExpenseResult = Awaited<ReturnType<typeof addExpense>>;

// ✅ Server Action return shape — always this exact signature
return { data: T | null, error: string | null }

// ✅ Prefer type for unions
type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank Transfer";
type ExpenseCategory = "food" | "transport" | "shopping" | ...;
```

### Import Order (always this order)

```ts
// 1. React / Next.js
import { useState } from "react";
import { redirect } from "next/navigation";

// 2. Third-party
import { format } from "date-fns";
import { z } from "zod";

// 3. Internal — absolute paths with @/
import { createServerClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validations/expense.schema";
import { ExpenseTable } from "@/components/expenses/expense-table";

// 4. Types
import type { Expense } from "@/types/expense.types";
```

### Currency Formatting — Always Use the Utility

```ts
// src/lib/utils/currency.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}
// Output: ₹12,450.00

// ✅ Use everywhere
<span className="font-mono tabular-nums">{formatCurrency(expense.amount)}</span>

// ❌ Never hardcode
<span>₹{expense.amount}</span>
```

### Amount Display Rules

- Font: `font-mono tabular-nums` always
- Expenses: `text-[#ff3b30]` (Apple red)
- Income: `text-[#34c759]` (Apple green)
- Neutral balance: `text-[var(--text-primary)]`
- Always right-aligned in tables

---

## 7. Component Patterns

### Standard Component Structure

```tsx
// 1. Props interface ALWAYS defined above the component
interface SummaryCardProps {
  emoji: string;
  label: string;
  amount: number;
  trend?: number; // percentage vs last month
  trendDirection?: "up" | "down";
}

// 2. Named export (not default) for all components except page.tsx
export function SummaryCard({ emoji, label, amount, trend, trendDirection }: SummaryCardProps) {
  return (
    <div className="apple-card p-6">
      <span className="text-2xl">{emoji}</span>
      <p className="text-[13px] text-[var(--text-secondary)] mt-3">{label}</p>
      <p className="text-[28px] font-semibold font-mono tabular-nums mt-1">
        {formatCurrency(amount)}
      </p>
      {trend !== undefined && (
        <p className={trendDirection === "down" ? "text-[#34c759]" : "text-[#ff3b30]"}>
          {trendDirection === "down" ? "↓" : "↑"} {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  );
}
```

### Client vs Server Component Rules

| Scenario                         | Use                     |
| -------------------------------- | ----------------------- |
| Fetching data                    | Server Component        |
| Displaying data (no interaction) | Server Component        |
| Forms, modals, dialogs           | Client Component        |
| Realtime subscriptions           | Client Component        |
| URL filter state                 | Client Component (nuqs) |
| Charts (Recharts)                | Client Component        |

Mark client components with `"use client"` at top.  
Mark server actions with `"use server"` at top.  
Never mix — they are separate files.

### Empty State Pattern

```tsx
// Always show empty states — never blank pages
export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <span className="text-5xl">{emoji}</span>
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <p className="text-[15px] text-[var(--text-secondary)] text-center max-w-sm">{description}</p>
      {action}
    </div>
  );
}
```

### Loading State Rule

- Use **skeleton** components, never spinners for content
- Use Apple-style spinner only on button loading states
- Skeleton color: `bg-[rgba(120,120,128,0.12)] animate-pulse`
- Skeleton radius must match the real component's radius

---

## 8. Server Actions Pattern

```ts
// src/app/actions/expense.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validations/expense.schema";
import type { Expense } from "@/types/expense.types";

// ✅ Always return { data, error } — never throw
export async function addExpense(
  formData: FormData
): Promise<{ data: Expense | null; error: string | null }> {
  const supabase = createServerClient();

  // 1. Auth check first — always
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Unauthorized" };

  // 2. Validate with Zod
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  // 3. Database operation
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // 4. Revalidate affected paths
  revalidatePath("/expenses");
  revalidatePath("/");
  revalidatePath("/analytics");

  return { data, error: null };
}
```

---

## 9. Data Fetching Rules

```tsx
// ✅ CORRECT — fetch in page.tsx (Server Component), pass as props
// src/app/(dashboard)/expenses/page.tsx
export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(50);

  return <ExpenseTable expenses={expenses ?? []} />;
}

// ❌ WRONG — never fetch in client component
"use client";
export function ExpenseTable() {
  const [expenses, setExpenses] = useState([]);
  useEffect(() => {
    fetch("/api/expenses").then(...) // ← NEVER DO THIS
  }, []);
}
```

### Realtime Exception

Only use `useEffect` + Supabase realtime subscription for live updates:

```ts
// src/hooks/use-realtime.ts — the ONLY acceptable useEffect for data
supabase
  .channel("expenses")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "expenses" },
    () => router.refresh() // Just refresh, don't manage state
  )
  .subscribe();
```

---

## 10. Emoji System

### Expense Categories

```ts
// src/lib/constants/categories.ts
export const EXPENSE_CATEGORIES = [
  { id: "food", label: "Food & Dining", emoji: "🍔", color: "#ff9500" },
  { id: "transport", label: "Transport", emoji: "🚗", color: "#007aff" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", color: "#af52de" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬", color: "#ff2d55" },
  { id: "health", label: "Health & Medical", emoji: "💊", color: "#ff3b30" },
  { id: "bills", label: "Bills & Utilities", emoji: "⚡", color: "#ffcc00" },
  { id: "education", label: "Education", emoji: "📚", color: "#5856d6" },
  { id: "travel", label: "Travel", emoji: "✈️", color: "#5ac8fa" },
  { id: "personal", label: "Personal Care", emoji: "💆", color: "#ff2d55" },
  { id: "rent", label: "Rent & Housing", emoji: "🏠", color: "#34c759" },
  { id: "gaming", label: "Gaming", emoji: "🎮", color: "#af52de" },
  { id: "coffee", label: "Coffee & Snacks", emoji: "☕", color: "#ff9500" },
  { id: "gifts", label: "Gifts", emoji: "🎁", color: "#ff2d55" },
  { id: "subscriptions", label: "Subscriptions", emoji: "📱", color: "#007aff" },
  { id: "misc", label: "Miscellaneous", emoji: "💡", color: "#6e6e73" },
] as const;
```

### Income Categories

```ts
export const INCOME_CATEGORIES = [
  { id: "salary", label: "Salary", emoji: "💼", color: "#34c759" },
  { id: "freelance", label: "Freelance", emoji: "🧾", color: "#007aff" },
  { id: "investments", label: "Investments", emoji: "📈", color: "#af52de" },
  { id: "gifts", label: "Gifts Received", emoji: "🎁", color: "#ff9500" },
  { id: "interest", label: "Interest", emoji: "🏦", color: "#5856d6" },
  { id: "side_hustle", label: "Side Hustle", emoji: "💸", color: "#ff2d55" },
  { id: "reimbursement", label: "Reimbursement", emoji: "🤝", color: "#5ac8fa" },
] as const;
```

### UI Emojis

```ts
// Navigation
"💳"; // Expenses
"💰"; // Income
"📊"; // Analytics
"🎯"; // Budgets
"⚙️"; // Settings
"👤"; // Profile

// Dashboard Cards
"💳"; // Total Spent Today
"📅"; // This Month
"💰"; // Net Balance
"🔥"; // Spending Streak

// Status
"✅"; // Paid / Success
"⏳"; // Pending
"🚨"; // Over Budget
"🎉"; // Goal Reached
"⚠️"; // Warning
"💡"; // Insight / Tip
```

---

## 11. Pages & Features

### Dashboard `/`

- [ ] 4 summary cards: Today Spent, Month Spent, Total Income, Net Balance
- [ ] Daily spending bar chart (current month, Recharts)
- [ ] Category donut chart (this month)
- [ ] Recent transactions (last 10)
- [ ] Budget mini-progress cards
- [ ] All server-side rendered

### Expenses `/expenses`

- [ ] Table: Date, Title, Category (emoji + label), Amount, Payment Method, Actions
- [ ] Add Expense dialog (title, amount, category, date, payment method, notes, tags)
- [ ] Edit expense dialog
- [ ] Delete with confirmation
- [ ] Bulk delete (checkbox selection)
- [ ] Filters: date range, category, payment method, amount range (URL state via nuqs)
- [ ] Pagination: 20 per page
- [ ] CSV export

### Income `/income`

- [ ] Table: Date, Title, Category (emoji), Amount, Source, Actions
- [ ] Add / Edit / Delete income
- [ ] Category breakdown chart

### Analytics `/analytics`

- [ ] Line chart: Income vs Expenses (last 6 months)
- [ ] Horizontal bar: Top spending categories
- [ ] Daily heatmap: spending by weekday
- [ ] Month-over-month % change cards
- [ ] Date range selector

### Budgets `/budgets`

- [ ] Budget cards per category
- [ ] Progress bar: green <70%, yellow 70–90%, red >90%
- [ ] Add Budget: category, amount, period, start date
- [ ] Over-budget alert badge
- [ ] RadialBarChart overview

### Settings `/settings`

- [ ] Profile: name, email (display only)
- [ ] Default payment method preference
- [ ] Theme toggle: Light / Dark / System
- [ ] Danger zone: Delete all data (with confirmation)

---

## 12. Environment Variables

```bash
# .env.local — never commit this file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Variable rules:

- `NEXT_PUBLIC_` prefix only for values safe to expose to browser
- Service role key NEVER in frontend code
- Always validate env vars exist at app startup

---

## 13. DO NOTs — Hard Rules

```
🚫 No `any` TypeScript type — ever
🚫 No inline styles — Tailwind classes only
🚫 No API routes — Server Actions only
🚫 No useEffect for data fetching
🚫 No hardcoded user IDs
🚫 No skipping loading states
🚫 No skipping empty states
🚫 No class components
🚫 No committing .env files
🚫 No moment.js / dayjs — use date-fns
🚫 No axios — use fetch
🚫 No redux / zustand — use React state + URL state
🚫 No default exports except page.tsx and layout.tsx
🚫 No console.log in production code
🚫 No hardcoded currency symbols — always use formatCurrency()
🚫 No spinners for content loading — use skeletons
🚫 No modifying files in components/ui/ — shadcn managed
🚫 No adding new dependencies without updating this file
```

---

## 14. Checklist Before Every Change

Before writing any code, confirm:

- [ ] Does this follow the folder structure in Section 3?
- [ ] Is the component Server or Client — and is that the right choice?
- [ ] Are all TypeScript types defined with no `any`?
- [ ] Does the UI use Apple colors from Section 5?
- [ ] Is currency formatted using `formatCurrency()` from `@/lib/utils/currency`?
- [ ] Does the form use React Hook Form + Zod?
- [ ] Is the data mutation a Server Action in `app/actions/`?
- [ ] Does the Server Action return `{ data, error }`?
- [ ] Are all affected paths revalidated after mutation?
- [ ] Is there a loading skeleton for async content?
- [ ] Is there an empty state for empty lists?
- [ ] Does it look and feel Apple — glass, SF Pro, correct colors?
- [ ] Is dark mode tested?
- [ ] Is it mobile responsive (min 375px)?

---

> 💡 **When in doubt:** Look at how Apple's iOS 18 Wallet or Health app handles it. That's the target.  
> 📌 **This file is the law.** No exceptions without updating this file first.
