# Architectural Improvements - Implementation Guide

## Summary of Changes

This document shows how to use the new architectural improvements that have been implemented.

---

## 1. Auth Middleware Wrapper

### Location

`src/lib/auth/server-action-wrapper.ts`

### Benefits

- Eliminates duplicate auth checks in every action
- Centralized user ID retrieval
- Consistent error handling
- Resource ownership verification

### Before (Old Pattern)

```typescript
// src/app/actions/expense.actions.ts
export const addExpense = async (formData: FormData) => {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    throw new Error("Not authenticated");
  }

  // ... rest of logic
};
```

### After (New Pattern)

```typescript
import { protectedAction } from "@/lib/auth/server-action-wrapper";

export const addExpense = protectedAction(async (userId, formData) => {
  // userId is guaranteed to exist
  // No auth check needed!
  // ... rest of logic
});
```

### Available Wrappers

1. **`protectedAction(handler)`** - Requires authentication

   ```typescript
   export const editLoan = protectedAction(async (userId, formData) => {
     // userId is guaranteed
   });
   ```

2. **`optionalAuthAction(handler)`** - Auth is optional

   ```typescript
   export const getPublicStats = optionalAuthAction(async (userId) => {
     // userId might be null
   });
   ```

3. **`getAuthenticatedUser()`** - Get full user object

   ```typescript
   const user = await getAuthenticatedUser(); // throws if not auth
   ```

4. **`getUserId()`** - Get just the user ID

   ```typescript
   const userId = await getUserId(); // throws if not auth
   ```

5. **`verifyResourceOwnership(resourceOwnerId, userId)`** - Verify ownership
   ```typescript
   verifyResourceOwnership(loan.user_id, userId); // throws if not owner
   ```

---

## 2. Revalidation Path Registry

### Location

`src/lib/constants/revalidation-paths.ts`

### Benefits

- Never forget to revalidate a path
- IDE autocomplete
- Single source of truth for cache invalidation
- Centralized path management

### Before (Old Pattern)

```typescript
// Scattered across different action files
export const addExpense = async (formData: FormData) => {
  // ... add expense logic ...
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  // Hope I didn't forget any paths!
};
```

### After (New Pattern)

```typescript
import { REVALIDATION_PATHS, revalidateRelatedPaths } from "@/lib/constants/revalidation-paths";

export const addExpense = protectedAction(async (userId, formData) => {
  // ... add expense logic ...

  // One function call revalidates all related paths
  await revalidateRelatedPaths("expense");
});
```

### Available Paths

```typescript
// Dashboard
REVALIDATION_PATHS.DASHBOARD;

// Expenses
REVALIDATION_PATHS.EXPENSES.LIST;
REVALIDATION_PATHS.EXPENSES.DETAIL;

// Income
REVALIDATION_PATHS.INCOME.LIST;
REVALIDATION_PATHS.INCOME.DETAIL;

// Budgets
REVALIDATION_PATHS.BUDGETS.LIST;
REVALIDATION_PATHS.BUDGETS.DETAIL;

// Loans
REVALIDATION_PATHS.LOANS.DASHBOARD;
REVALIDATION_PATHS.LOANS.LIST;
REVALIDATION_PATHS.LOANS.DETAIL;
REVALIDATION_PATHS.LOANS.ANALYTICS;

// Money (P2P)
REVALIDATION_PATHS.MONEY.GIVEN;
REVALIDATION_PATHS.MONEY.TAKEN;

// Analytics
REVALIDATION_PATHS.ANALYTICS.DASHBOARD;
```

### Smart Invalidation

```typescript
// Automatically invalidates related pages
await revalidateRelatedPaths("expense"); // Invalidates dashboard, expenses list, analytics
await revalidateRelatedPaths("budget"); // Invalidates budgets list, analytics
await revalidateRelatedPaths("loan"); // Invalidates loans dashboard, list, analytics
```

---

## 3. Structured Error Handling

### Location

- Error Types: `src/lib/errors/error-types.ts`
- Error Handler: `src/lib/errors/error-handler.ts`

### Benefits

- Type-safe error handling
- Consistent error responses
- User-friendly error messages
- Automatic error logging
- Error recovery strategies

### Before (Old Pattern)

```typescript
export const addExpense = async (formData: FormData) => {
  try {
    // ... logic ...
  } catch (error) {
    // Generic error message
    return { error: (error as Error).message };
  }
};
```

### After (New Pattern)

```typescript
import {
  protectedAction,
  withErrorHandling,
  ValidationError,
  NotFoundError,
  AppError,
} from "@/lib/auth/server-action-wrapper";
import { revalidateRelatedPaths } from "@/lib/constants/revalidation-paths";

export const addExpense = withErrorHandling(
  protectedAction(async (userId, formData) => {
    const data = parseFormData(formData);

    // Validation errors are automatically caught
    if (!data.amount) {
      throw new ValidationError("Validation failed", {
        amount: ["Amount is required"],
      });
    }

    const expense = await supabase
      .from("expenses")
      .insert({ ...data, user_id: userId })
      .single();

    if (!expense) {
      throw new NotFoundError("Expense");
    }

    await revalidateRelatedPaths("expense");
    return expense;
  }),
  {
    action: "add-expense",
    userId: "provided-in-wrapper",
  }
);
```

### Error Types Available

```typescript
// Authentication/Authorization
new AuthenticationError("Please log in");
new AuthorizationError("Permission denied");

// Validation
new ValidationError("Validation failed", {
  field: ["error message"],
});

// Resource
new NotFoundError("Expense", "expense-123");
new ConflictError("This expense already exists");

// Business Logic
new InvalidStateError("Cannot delete completed loan");
new InsufficientFundsError(available, required);

// External Services
new ExternalServiceError("Supabase", "Connection timeout");
new DatabaseError("Table not found", "insert");

// Rate Limiting
new RateLimitError(60); // Retry after 60s

// Generic
new InternalServerError("Something went wrong");
```

### Client-Side Error Handling

```typescript
// In client components
const response = await addExpense(formData);

if (!response.success) {
  // Handle validation errors
  const validationErrors = getValidationErrors(response.error);
  if (validationErrors) {
    setFieldErrors(validationErrors);
  }

  // Show user-friendly message
  const message = getErrorMessage(response.error);
  toast.error(message);

  return;
}

// Success!
toast.success("Expense added");
```

---

## 4. Unified Loan Calculation Engine

### Location

`src/lib/loans/loan-engine.ts`

### Benefits

- Single source of truth for all loan math
- Precision using Decimal.js
- Consistent calculations across UI and exports
- Easy to test mathematical correctness
- Handles all loan types uniformly

### Available Calculations

#### 1. EMI Calculation

```typescript
import { LoanCalculationEngine } from '@/lib/loans/loan-engine';

const emi = LoanCalculationEngine.calculateEMI(
  principal: 500000,      // ₹500,000
  annualRate: 8.5,        // 8.5% per annum
  tenureMonths: 60        // 5 years
);
// Returns: Decimal with exact EMI amount
```

#### 2. Simple Interest (for moratorium)

```typescript
const interest = LoanCalculationEngine.calculateSimpleInterest(
  principal: 200000,
  annualRate: 6.5,
  years: 1.5
);
// Returns: ₹19,500
```

#### 3. Compound Interest

```typescript
const interest = LoanCalculationEngine.calculateCompoundInterest(
  principal: 100000,
  annualRate: 8,
  years: 2,
  compoundingPeriodsPerYear: 12 // monthly
);
```

#### 4. Full Amortization Schedule

```typescript
const schedule = LoanCalculationEngine.generateAmortizationSchedule(
  principal: 500000,
  annualRate: 8.5,
  tenureMonths: 60,
  startDate: new Date('2024-01-15')
);

// Returns array of:
// {
//   month: 1,
//   date: Date,
//   beginningBalance: Decimal,
//   emiPayment: Decimal,
//   principalPaid: Decimal,
//   interestPaid: Decimal,
//   endingBalance: Decimal
// }
```

#### 5. Remaining Balance After N Months

```typescript
const remaining = LoanCalculationEngine.calculateRemainingBalance(
  originalPrincipal: 500000,
  annualRate: 8.5,
  totalMonths: 60,
  monthsElapsed: 24
);
// Returns: Outstanding balance after 24 months
```

#### 6. Remaining Tenure

```typescript
const months = LoanCalculationEngine.calculateRemainingTenure(
  outstandingBalance: 250000,
  emi: 10142.75,
  annualRate: 8.5
);
// Returns: Number of months to payoff
```

#### 7. Loan Health Score

```typescript
const health = LoanCalculationEngine.calculateHealthScore({
  daysOverdue: 0,
  onTimePaymentPercentage: 95,
  outstandingBalance: 250000,
  totalPrincipal: 500000,
  monthsRemaining: 24,
});

// Returns:
// {
//   score: 92,  // 0-100
//   status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical',
//   daysOverdue: 0,
//   paymentHistory: 95,
//   utilizationRate: 50,
//   recommendation: 'Keep up the great work!'
// }
```

#### 8. Payoff Projection

```typescript
const projection = LoanCalculationEngine.projectLoanPayoff(
  outstandingBalance: 250000,
  monthlyPayment: 10142.75,
  annualRate: 8.5,
  currentDate: new Date()
);

// Returns:
// {
//   totalInterestAccrued: Decimal,
//   totalAmountDue: Decimal,
//   remainingTenure: 24,
//   projectedCompletionDate: Date,
//   earlyPayoffDate: Date
// }
```

### Refactoring Existing Loan Code

Instead of scattered calculations:

```typescript
// Old: scattered loan math
function calculateInterest(principal, rate, months) { ... }
function calculateEMI(principal, rate, months) { ... }
function generateAmortization() { ... }
```

Use the unified engine:

```typescript
// New: centralized engine
const emi = LoanCalculationEngine.calculateEMI(principal, rate, months);
const schedule = LoanCalculationEngine.generateAmortizationSchedule(...);
const health = LoanCalculationEngine.calculateHealthScore(...);
```

---

## 5. Migration Checklist

### Phase 1: Core Infrastructure (Week 1)

- [ ] Import and use `protectedAction` in new actions
- [ ] Import `REVALIDATION_PATHS` and use in new actions
- [ ] Use `LoanCalculationEngine` in new loan features
- [ ] Test error types with sample errors

### Phase 2: Refactor Existing Actions (Week 2-3)

- [ ] Convert `expense.actions.ts` to use wrappers
- [ ] Convert `budget.actions.ts` to use wrappers
- [ ] Convert `loan.actions.ts` to use wrappers
- [ ] Convert other action files

### Phase 3: Update Components (Week 3-4)

- [ ] Update expense components to use new error handling
- [ ] Update loan components to use LoanCalculationEngine
- [ ] Add optimistic UI updates (separate task)
- [ ] Add loading states

### Phase 4: Testing & Validation

- [ ] Test all migrated actions
- [ ] Verify error messages are user-friendly
- [ ] Validate loan calculations match old code
- [ ] Check cache invalidation works correctly

---

## 6. Example: Complete Refactored Action

### Before

```typescript
// src/app/actions/expense.actions.ts (OLD)
export const addExpense = async (formData: FormData) => {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const expenseSchema = z.object({
      title: z.string().min(1),
      amount: z.number().positive(),
      date: z.string(),
      category: z.string(),
    });

    const rawData = Object.fromEntries(formData);
    const validData = expenseSchema.parse(rawData);

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        title: validData.title,
        amount: validData.amount,
        date: validData.date,
        category_id: validData.category,
        user_id: user.id,
      })
      .single();

    if (error) {
      return { error: "Failed to add expense" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");

    return { data };
  } catch (error) {
    return { error: (error as Error).message };
  }
};
```

### After

```typescript
// src/app/actions/expense.actions.ts (NEW)
import { protectedAction, withErrorHandling } from "@/lib/auth/server-action-wrapper";
import { revalidateRelatedPaths } from "@/lib/constants/revalidation-paths";
import { expenseSchema } from "@/lib/validations/schemas/expense.schema";
import { createClient } from "@/lib/supabase/server";

export const addExpense = withErrorHandling(
  protectedAction(async (userId, formData) => {
    // userId is guaranteed to exist, no auth check needed!

    const supabase = createClient();
    const rawData = Object.fromEntries(formData);

    // Validation is automatic - throws ValidationError on failure
    const validData = await expenseSchema.parseAsync(rawData);

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        title: validData.title,
        amount: validData.amount,
        date: validData.date,
        category_id: validData.category,
        user_id: userId,
      })
      .single();

    if (error) {
      throw new DatabaseError(error.message, "insert");
    }

    // One function invalidates all related paths!
    await revalidateRelatedPaths("expense");

    return data;
  }),
  {
    action: "add-expense",
  }
);
```

### Benefits of New Version

✅ **Shorter** - No duplicate auth boilerplate  
✅ **Cleaner** - Errors are typed and handled consistently  
✅ **Safer** - Auto revalidation of all related paths  
✅ **Better DX** - Consistent patterns across all actions  
✅ **Easier to Debug** - Errors logged in development mode  
✅ **User-Friendly** - Meaningful error messages

---

## 7. Questions & Support

### Q: Can I use both old and new patterns?

**A:** Yes! They coexist. Gradually migrate at your own pace. New features should use new patterns.

### Q: How do I test actions with the new wrappers?

**A:** The wrappers return `ActionResponse<T>` type. Test with:

```typescript
const result = await addExpense(formData);
if (!result.success) {
  expect(result.error.code).toBe("VALIDATION_FAILED");
}
```

### Q: Performance impact?

**A:** Negligible. The wrappers are thin layers. Loan engine uses Decimal.js which is slightly slower than Math but essential for financial accuracy.

### Q: Do I need to migrate all actions at once?

**A:** No. Migrate gradually, starting with new features and most-used actions. Aim for 100% migration over time.

---

## Next Steps

1. **Review** this implementation guide
2. **Start** migrating one action file at a time
3. **Test** thoroughly before moving to next file
4. **Gather** team feedback on new patterns
5. **Document** any project-specific conventions
