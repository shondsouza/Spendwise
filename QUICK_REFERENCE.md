# Quick Reference: New Architecture Patterns

## 1. Server Actions with Auth

### Basic Protected Action

```typescript
import { protectedAction } from "@/lib/auth/server-action-wrapper";

export const myAction = protectedAction(async (userId, formData) => {
  // userId is guaranteed
  // return result
});
```

### With Error Handling

```typescript
import { protectedAction, withErrorHandling } from "@/lib/auth/server-action-wrapper";
import { ValidationError } from "@/lib/errors/error-types";

export const myAction = withErrorHandling(
  protectedAction(async (userId, formData) => {
    if (!valid) throw new ValidationError("...", { field: ["error"] });
    return result;
  }),
  { action: "my-action" }
);
```

---

## 2. Cache Invalidation

### Invalidate Related Paths

```typescript
import { revalidateRelatedPaths } from "@/lib/constants/revalidation-paths";

// After action completes
await revalidateRelatedPaths("expense"); // Invalidates multiple related paths
```

### Manual Path Invalidation

```typescript
import { REVALIDATION_PATHS } from "@/lib/constants/revalidation-paths";
import { revalidatePath } from "next/cache";

revalidatePath(REVALIDATION_PATHS.DASHBOARD);
revalidatePath(REVALIDATION_PATHS.EXPENSES.LIST);
```

---

## 3. Error Handling

### In Server Actions

```typescript
import { ValidationError, NotFoundError } from "@/lib/errors/error-types";

throw new ValidationError("Validation failed", {
  email: ["Invalid email format"],
  amount: ["Must be positive"],
});

throw new NotFoundError("Expense", "exp-123");
```

### In Client Components

```typescript
const response = await myAction(formData);

if (!response.success) {
  const message = getErrorMessage(response.error);
  toast.error(message);

  const fieldErrors = getValidationErrors(response.error);
  if (fieldErrors) setErrors(fieldErrors);
}
```

---

## 4. Loan Calculations

### Calculate EMI

```typescript
import { LoanCalculationEngine } from "@/lib/loans/loan-engine";

const emi = LoanCalculationEngine.calculateEMI(500000, 8.5, 60);
// EMI: ₹10,142.75 (for ₹500k @ 8.5% for 60 months)
```

### Generate Amortization Schedule

```typescript
const schedule = LoanCalculationEngine.generateAmortizationSchedule(500000, 8.5, 60, new Date());

schedule.forEach((entry) => {
  console.log(
    `Month ${entry.month}: Interest ${entry.interestPaid}, Principal ${entry.principalPaid}`
  );
});
```

### Calculate Health Score

```typescript
const health = LoanCalculationEngine.calculateHealthScore({
  daysOverdue: 0,
  onTimePaymentPercentage: 95,
  outstandingBalance: 250000,
  totalPrincipal: 500000,
  monthsRemaining: 24,
});

console.log(`Score: ${health.score}/100 - ${health.status}`);
console.log(`Recommendation: ${health.recommendation}`);
```

### Project Loan Payoff

```typescript
const projection = LoanCalculationEngine.projectLoanPayoff(
  250000, // outstanding
  10142.75, // monthly payment
  8.5, // annual rate
  new Date()
);

console.log(`Payoff in ${projection.remainingTenure} months`);
console.log(`By: ${projection.projectedCompletionDate}`);
console.log(`Total interest: ${projection.totalInterestAccrued}`);
```

---

## 5. Complete Action Example

```typescript
"use server";

import {
  protectedAction,
  withErrorHandling,
  ValidationError,
} from "@/lib/auth/server-action-wrapper";
import { revalidateRelatedPaths } from "@/lib/constants/revalidation-paths";
import { NotFoundError, DatabaseError } from "@/lib/errors/error-types";
import { createClient } from "@/lib/supabase/server";
import { loanSchema } from "@/lib/validations/schemas/loan.schema";

export const createLoan = withErrorHandling(
  protectedAction(async (userId, formData) => {
    const supabase = createClient();

    // Validate input
    const rawData = Object.fromEntries(formData);
    const validData = await loanSchema.parseAsync(rawData);

    // Create loan
    const { data, error } = await supabase
      .from("user_loans")
      .insert({
        user_id: userId,
        ...validData,
      })
      .single();

    if (error) {
      throw new DatabaseError(error.message, "insert");
    }

    if (!data) {
      throw new NotFoundError("Loan");
    }

    // Invalidate all related caches
    await revalidateRelatedPaths("loan");

    return data;
  }),
  { action: "create-loan" }
);
```

---

## 6. Component Usage

```typescript
'use client';

import { createLoan } from '@/app/actions/loan.actions';
import { getErrorMessage, getValidationErrors } from '@/lib/errors/error-handler';
import { useState } from 'react';
import { toast } from 'sonner';

export function CreateLoanForm() {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const response = await createLoan(formData);

    if (!response.success) {
      const message = getErrorMessage(response.error);
      toast.error(message);

      const fieldErrors = getValidationErrors(response.error);
      if (fieldErrors) setErrors(fieldErrors);
    } else {
      toast.success('Loan created!');
      // Success handling
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with error.field display */}
    </form>
  );
}
```

---

## 7. Testing

```typescript
import { describe, it, expect } from "vitest";
import { LoanCalculationEngine } from "@/lib/loans/loan-engine";

describe("Loan Calculations", () => {
  it("calculates EMI correctly", () => {
    const emi = LoanCalculationEngine.calculateEMI(500000, 8.5, 60);
    expect(emi.toNumber()).toBeCloseTo(10142.75, 2);
  });

  it("generates valid amortization schedule", () => {
    const schedule = LoanCalculationEngine.generateAmortizationSchedule(500000, 8.5, 60);

    expect(schedule).toHaveLength(60);
    expect(schedule[0].beginningBalance.toNumber()).toBe(500000);
    expect(schedule[59].endingBalance.toNumber()).toBeCloseTo(0, 0);
  });

  it("health score is 0-100", () => {
    const health = LoanCalculationEngine.calculateHealthScore({
      daysOverdue: 0,
      onTimePaymentPercentage: 100,
      outstandingBalance: 250000,
      totalPrincipal: 500000,
      monthsRemaining: 24,
    });

    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqualTo(100);
  });
});
```

---

## 8. Error Types Quick Reference

| Error                    | When to Use                        | HTTP Status |
| ------------------------ | ---------------------------------- | ----------- |
| `AuthenticationError`    | User not logged in                 | 401         |
| `AuthorizationError`     | User lacks permission              | 403         |
| `ValidationError`        | Invalid input data                 | 400         |
| `NotFoundError`          | Resource doesn't exist             | 404         |
| `ConflictError`          | Duplicate/conflicting data         | 409         |
| `InvalidStateError`      | Operation invalid in current state | 400         |
| `InsufficientFundsError` | Not enough funds/balance           | 400         |
| `DatabaseError`          | Database operation failed          | 500         |
| `ExternalServiceError`   | Third-party service error          | 502         |
| `RateLimitError`         | Too many requests                  | 429         |
| `InternalServerError`    | Generic server error               | 500         |

---

## 9. Common Patterns

### Create with Validation + Revalidation

```typescript
export const addExpense = withErrorHandling(
  protectedAction(async (userId, formData) => {
    const data = await expenseSchema.parseAsync(Object.fromEntries(formData));
    const result = await supabase
      .from("expenses")
      .insert({ ...data, user_id: userId })
      .single();
    if (!result.data) throw new NotFoundError("Expense");
    await revalidateRelatedPaths("expense");
    return result.data;
  })
);
```

### Edit with Ownership Check

```typescript
export const editExpense = protectedAction(async (userId, formData) => {
  const id = formData.get("id");
  const expense = await getExpense(id);
  verifyResourceOwnership(expense.user_id, userId);

  const data = await expenseSchema.parseAsync(Object.fromEntries(formData));
  await supabase.from("expenses").update(data).eq("id", id);
  await revalidateRelatedPaths("expense");
});
```

### Delete with Cascade Protection

```typescript
export const deleteExpense = protectedAction(async (userId, formData) => {
  const id = formData.get("id");
  const expense = await getExpense(id);
  verifyResourceOwnership(expense.user_id, userId);

  await supabase.from("expenses").delete().eq("id", id);
  await revalidateRelatedPaths("expense");
});
```

---

## 10. File Organization

```
src/
├── app/
│   └── actions/           # Server actions (use protectedAction)
├── components/            # UI components (use new error handling)
├── lib/
│   ├── auth/
│   │   └── server-action-wrapper.ts  ← Auth & wrappers
│   ├── errors/
│   │   ├── error-types.ts            ← Error definitions
│   │   └── error-handler.ts          ← Error handling utilities
│   ├── constants/
│   │   └── revalidation-paths.ts     ← Cache invalidation paths
│   └── loans/
│       └── loan-engine.ts            ← Loan calculations
└── types/                # TypeScript types
```

---

## Quick Checklist Before Committing

- [ ] New action uses `protectedAction()` wrapper
- [ ] Errors inherit from `AppError` types
- [ ] Revalidation uses `revalidateRelatedPaths()`
- [ ] Loan calculations use `LoanCalculationEngine`
- [ ] Error handling in components uses `getErrorMessage()`
- [ ] Field validation errors handled separately
- [ ] No duplicate auth checks
- [ ] No scattered revalidation paths
- [ ] Database operations wrapped in error handling
