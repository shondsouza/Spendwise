# Contributing to SpendWise

Thank you for your interest in contributing! This guide will help you understand how to work with the SpendWise codebase.

## 🎯 Code Standards

### TypeScript

We use TypeScript in **strict mode** to catch errors early:

```typescript
// ✅ Good - Explicit types
interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
}

// ❌ Bad - Never use 'any'
const expense: any = {}; // Will fail ESLint
```

**Rule:** Every variable, function, and component must have explicit types.

### React Components

All components must:

1. Have a props interface defined above the component
2. Use "use client" for client-side features
3. Follow file naming: `PascalCase.tsx`

```typescript
interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary";
  onClick: () => void;
}

export function Button({ label, variant = "primary", onClick }: ButtonProps) {
  // Component body
}
```

### Server Actions

All mutations use Server Actions (no API routes):

```typescript
// ✅ Good - Server Action
export async function addExpense(formData: FormData) {
  const validated = expenseSchema.safeParse({
    /* ... */
  });
  if (!validated.success) {
    return { data: null, error: "Invalid data" };
  }
  // Insert to DB
  return { data: newExpense, error: null };
}

// ❌ Bad - API routes
export async function POST(req: Request) {
  // Don't do this
}
```

### Component Organization

```
components/
├── ui/                    # Reusable UI primitives
│   └── button.tsx
├── shared/                # Cross-feature components
│   └── sidebar.tsx
├── dashboard/             # Feature-specific
│   └── summary-cards.tsx
└── expenses/              # Feature-specific
    └── expense-table.tsx
```

**When to create a new file:**

- Component over 150 lines → extract to separate file
- Reusable across multiple features → move to shared/
- Feature-specific → keep in feature folder

### Styling

Use **Tailwind CSS** utilities only - no inline styles:

```typescript
// ✅ Good
<div className="flex items-center gap-2 p-4 rounded-lg bg-white dark:bg-zinc-900">

// ❌ Bad - Inline styles
<div style={{ display: 'flex', padding: '16px' }}>

// ❌ Bad - CSS modules
import styles from './Button.module.css'
```

### Database Queries

Always include user_id check for security:

```typescript
// ✅ Good - Explicit user check
const { data, error } = await supabase.from("expenses").select().eq("user_id", user.id); // REQUIRED

// ❌ Bad - Forgot user_id check
const { data } = await supabase.from("expenses").select(); // Could leak other users' data!
```

---

## 📝 Adding a New Feature

### Step 1: Define Types

Create types in `src/types/index.ts`:

```typescript
export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  date: Date;
  created_at: Date;
}
```

### Step 2: Create Validation Schema

Add to `src/lib/validations/`:

```typescript
import { z } from "zod";

export const transactionSchema = z.object({
  title: z.string().min(1).max(100),
  amount: z.number().positive(),
  date: z.coerce.date(),
});

export type TransactionForm = z.infer<typeof transactionSchema>;
```

### Step 3: Create Server Action

Add to `src/app/actions/`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema } from "@/lib/validations/transaction.schema";

export async function addTransaction(formData: FormData) {
  try {
    const validated = transactionSchema.safeParse({
      title: formData.get("title"),
      amount: parseFloat(formData.get("amount") as string),
      date: new Date(formData.get("date") as string),
    });

    if (!validated.success) {
      return { data: null, error: "Invalid input" };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: user.id,
          ...validated.data,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/transactions");
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
```

### Step 4: Create Components

UI component in `src/components/ui/`:

```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
```

Feature component in `src/components/transactions/`:

```typescript
'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addTransaction } from '@/app/actions/transaction.actions';
import { toast } from 'sonner';

export function AddTransactionForm() {
  const [open, setOpen] = useState(false);
  const { pending } = useFormStatus();

  async function handleSubmit(formData: FormData) {
    const result = await addTransaction(formData);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Transaction added!');
    setOpen(false);
  }

  return (
    // Form JSX
  );
}
```

### Step 5: Create Page

Add to `src/app/(dashboard)/transactions/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getTransactions } from '@/app/actions/transaction.actions';
import { Transaction } from '@/types';
import { AddTransactionForm } from '@/components/transactions/add-transaction-form';
import { TransactionTable } from '@/components/transactions/transaction-table';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getTransactions();
      if (result.data) {
        setTransactions(result.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div>
      <AddTransactionForm />
      {loading ? <div>Loading...</div> : <TransactionTable transactions={transactions} />}
    </div>
  );
}
```

---

## 🧪 Testing

### Run All Tests

```bash
npm run test
```

### Testing Patterns

```typescript
// Component test
describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});

// Server Action test
describe('addExpense', () => {
  it('returns error for invalid data', async () => {
    const result = await addExpense(new FormData());
    expect(result.error).toBeDefined();
  });
});
```

---

## 🔍 Code Review Checklist

Before submitting a PR, verify:

- [ ] **Types**: No `any` types, all params typed
- [ ] **Tests**: New features have tests
- [ ] **Styles**: Only Tailwind CSS, no inline styles
- [ ] **Accessibility**: ARIA labels, semantic HTML
- [ ] **Performance**: No unnecessary renders
- [ ] **Security**: User ID checked in queries
- [ ] **Documentation**: README updated if needed
- [ ] **Lint**: `npm run lint` passes
- [ ] **Format**: `npm run format` applied

### Running Pre-commit Checks

```bash
npm run type-check   # TypeScript
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Unit tests
```

---

## 🐛 Bug Reports

When reporting bugs, include:

1. **Steps to reproduce**

   ```
   1. Go to /expenses
   2. Click "Add expense"
   3. Fill in form with X, Y, Z
   ```

2. **Expected behavior**
   - Expense should be added

3. **Actual behavior**
   - Error message: "..."

4. **Screenshots/Videos**
   - Attach if possible

5. **Environment**
   - Browser: Chrome 120
   - OS: Windows 11
   - Node: 18.17

---

## 🚀 Performance Tips

### Optimize Components

```typescript
// ✅ Good - Memoize expensive components
const ExpensiveChart = React.memo(({ data }: Props) => {
  return <Chart data={data} />;
});

// ❌ Bad - Rerenders every parent render
function ExpensiveChart({ data }: Props) {
  return <Chart data={data} />;
}
```

### Optimize Queries

```typescript
// ✅ Good - Indexed query
.select()
.eq('user_id', userId)
.order('date', { ascending: false })
.limit(10);

// ❌ Bad - Will scan full table
.select()
.filter('title', 'ilike', `%${search}%`);
```

### Optimize Rendering

```typescript
// ✅ Good - Server component for data fetching
export default async function Dashboard() {
  const data = await fetchExpenses();
  return <ExpenseChart data={data} />;
}

// ❌ Bad - Client fetches data on mount
function Dashboard() {
  useEffect(() => {
    fetch('/api/expenses');
  }, []);
}
```

---

## 📚 Resources

- **TypeScript**: https://www.typescriptlang.org/docs/
- **React**: https://react.dev
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Supabase**: https://supabase.com/docs

---

## ❓ Questions?

- Check existing issues/discussions first
- Read ARCHITECTURE.md for design decisions
- Ask in PR comments
- Create a discussion for major changes

---

**Thank you for contributing to SpendWise! 🚀**
