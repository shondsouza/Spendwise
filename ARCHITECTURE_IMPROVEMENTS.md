# Spendwise Architecture Improvements

## Overview

This document outlines concrete architectural improvements to enhance maintainability, performance, security, and developer experience.

---

## Priority 1: Critical Improvements (High Impact, Low Effort)

### 1.1 Create Auth Middleware Layer

**Problem**: Every server action re-implements auth checks with `await getUser()`
**Solution**: Create a centralized auth wrapper for server actions

**Files to create**:

- `src/lib/auth/server-action-wrapper.ts` - Unified auth wrapper
- `src/lib/auth/auth-context.ts` - Auth context for reuse

**Benefits**:

- DRY principle - no duplicate auth logic
- Single point to update auth checks
- Automatic audit logging
- Better error handling
- Type-safe authenticated operations

**Implementation**: See `server-action-wrapper.ts` below

---

### 1.2 Centralized Loan Calculation Engine

**Problem**: Loan math scattered across 6 files with inconsistency risk
**Solution**: Create unified, tested loan engine

**Files to refactor**:

- Create: `src/lib/loans/loan-engine.ts`
- Create: `src/lib/loans/interest-calculator.ts`
- Create: `src/lib/loans/amortization-engine.ts`

**Benefits**:

- Single source of truth for calculations
- Easier to test mathematical correctness
- Reduced bugs in compound interest, EMI, moratorium logic
- Consistent behavior across UI and exports

---

### 1.3 Establish Revalidation Path Registry

**Problem**: Manual `revalidatePath()` calls scattered, easy to miss paths
**Solution**: Centralized revalidation constant map

**Files to create**:

- `src/lib/constants/revalidation-paths.ts` - Central registry

**Benefits**:

- Never forget to revalidate a path
- IDE autocomplete for paths
- Single place to audit cache invalidation
- Easy to add new paths

---

### 1.4 Standardized Error Handling Pattern

**Problem**: Errors shown as generic toasts, no recovery path
**Solution**: Create error handling middleware

**Files to create**:

- `src/lib/errors/error-handler.ts` - Error classification & recovery
- `src/lib/errors/error-types.ts` - Typed errors

**Benefits**:

- User-friendly error messages
- Structured error logging
- Different handling for client vs. server errors
- Retry logic for transient failures

---

## Priority 2: Scalability Improvements (Medium Impact, Medium Effort)

### 2.1 Create Data Access Layer (DAL)

**Problem**: Supabase queries scattered across actions and components
**Solution**: Centralize database operations

**Files to create**:

- `src/lib/db/queries/` - Organized query functions
  - `expense.queries.ts`
  - `budget.queries.ts`
  - `loan.queries.ts`
  - etc.

**Structure**:

```typescript
// Each query file exports typed functions
export async function getExpensesByMonth(
  userId: string,
  month: Date
): Promise<Expense[]> { ... }
```

**Benefits**:

- Reusable queries across components
- Single point to add filtering/caching
- Easier pagination and performance tuning
- Type-safe database layer
- N+1 query detection point

---

### 2.2 Implement Optimistic UI Pattern

**Problem**: Users wait for server confirmation
**Solution**: Use React 19 `useOptimistic` hook

**Files to update**:

- `src/components/expenses/add-expense-dialog.tsx`
- `src/components/income/add-income-dialog.tsx`
- `src/components/budgets/create-budget-dialog.tsx`
- Loan management components

**Example**:

```typescript
const [optimisticExpenses, addOptimisticExpense] = useOptimistic(expenses, (state, newExpense) => [
  ...state,
  newExpense,
]);
```

**Benefits**:

- Instant UI feedback
- Better perceived performance
- Server failure shows rollback animation
- Professional UX

---

### 2.3 Create Validation Schema Library

**Problem**: Validation schemas in actions, not reusable
**Solution**: Centralized schema registry

**Files to organize**:

- `src/lib/validations/schemas/` (already exists, enhance)
  - `expense.schema.ts`
  - `budget.schema.ts`
  - `loan.schema.ts`

**Usage**:

- Export Zod schemas + inferred types
- Server actions import and reuse
- Client forms use same validation
- API routes (if added) use same schemas

---

### 2.4 Event-Driven Architecture for Side Effects

**Problem**: Hard to track all side effects of an action
**Solution**: Event system for cascading updates

**Files to create**:

- `src/lib/events/event-bus.ts` - Event dispatcher
- `src/lib/events/handlers/` - Event handlers
  - `on-expense-created.ts`
  - `on-loan-created.ts`
  - etc.

**Example side effects**:

- Expense created → revalidate dashboard
- Budget exceeded → send notification
- Loan paid off → archive snapshot
- Payment made → update loan health score

**Benefits**:

- Decoupled, maintainable code
- Easy to add new side effects
- Audit trail of what happens after actions

---

## Priority 3: Developer Experience (Low Impact on Runtime, High on DX)

### 3.1 API Route Standardization

**Problem**: Only server actions, no REST API for mobile clients
**Solution**: Create API route layer with shared logic

**Create routes**:

```
src/app/api/v1/
├── expenses/
├── budgets/
├── loans/
├── income/
└── middleware/ (auth, validation)
```

**Benefits**:

- Support for mobile apps (React Native)
- Swagger/OpenAPI documentation
- Third-party integrations
- Webhooks capability

---

### 3.2 Testing Infrastructure

**Problem**: Test coverage unclear, manual testing needed
**Solution**: Structured testing setup

**Files to create**:

- `src/lib/loans/__tests__/` - Unit tests for loan math
- `src/app/actions/__tests__/` - Action integration tests
- `vitest.config.ts` or `jest.config.js`

**Test targets**:

- Loan calculations (interest, EMI, moratorium)
- Edge cases (leap years, zero balance, etc.)
- Permission checks (user_id filtering)
- Validation schemas

---

### 3.3 Component Architecture Documentation

**Problem**: Component relationships unclear
**Solution**: Create component hierarchy guide

**Create**:

- `COMPONENT_GUIDE.md` - Component relationships
- Storybook setup for component catalog
- TypeScript props documentation

---

## Priority 4: Performance & Monitoring

### 4.1 Add Database Query Monitoring

**Problem**: Slow queries not detected
**Solution**: Query logging & performance tracking

**Implement**:

- Supabase query timing in DAL layer
- Log queries exceeding threshold
- Monitor N+1 patterns

---

### 4.2 Implement Request Deduplication

**Problem**: Multiple identical requests can be sent
**Solution**: Client-side request deduplication

**Files to create**:

- `src/lib/request-cache.ts` - Deduplicate in-flight requests

---

### 4.3 Streaming for Large Data

**Problem**: Large expense lists block rendering
**Solution**: Use React Server Components streaming

**Enhance**:

- Dashboard load latest expenses first
- Paginate or virtualize expense tables
- Stream analytics calculations

---

## Implementation Roadmap

### Week 1 (P1 - Critical)

- [ ] Auth middleware wrapper
- [ ] Revalidation path registry
- [ ] Loan calculation engine
- [ ] Error handling pattern

### Week 2 (P2 - Scalability)

- [ ] Data Access Layer
- [ ] Optimistic UI updates
- [ ] Event-driven architecture
- [ ] Validation schema library

### Week 3+ (P3 & P4)

- [ ] API routes
- [ ] Testing framework
- [ ] Monitoring & logging
- [ ] Performance optimization

---

## Code Examples

### Example 1: Auth Middleware Wrapper

```typescript
// src/lib/auth/server-action-wrapper.ts
export function protectedAction<T>(handler: (userId: string, formData: FormData) => Promise<T>) {
  return async function (formData: FormData) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      throw new UnauthorizedError("Not authenticated");
    }
    return handler(user.id, formData);
  };
}
```

### Example 2: Revalidation Registry

```typescript
// src/lib/constants/revalidation-paths.ts
export const REVALIDATION_PATHS = {
  DASHBOARD: "/dashboard",
  EXPENSES: "/dashboard/expenses",
  BUDGETS: "/dashboard/budgets",
  LOANS: "/dashboard/loan",
  ANALYTICS: "/dashboard/analytics",
} as const;
```

### Example 3: Loan Engine

```typescript
// src/lib/loans/loan-engine.ts
export class LoanCalculationEngine {
  calculateEMI(principal: number, rate: number, tenure: number): number {
    // Unified EMI calculation
  }

  generateAmortization(loan: Loan): AmortizationEntry[] {
    // Consistent amortization schedule
  }

  calculateHealth(loan: Loan): HealthScore {
    // Unified health scoring
  }
}
```

---

## Risk Mitigation

**Breaking Changes**:

- Implement P1 changes in parallel with existing code (feature flags)
- Gradually migrate actions to auth wrapper
- Test with production data before switching

**Testing Strategy**:

- Unit test new loan engine with existing calculations
- Integration tests for new DAL layer
- Manual regression testing on key flows

---

## Success Metrics

- [ ] 50% reduction in duplicate code (auth checks, queries)
- [ ] All errors have meaningful user messages
- [ ] Loan calculations tested with 95%+ coverage
- [ ] Zero cache invalidation bugs in 1 month
- [ ] Page load time < 2s (dashboard)
- [ ] DAL layer used by 80%+ of actions within 3 weeks

---

## Questions & Next Steps

1. Which P1 improvement to start with? (Recommend: Auth middleware)
2. Should we add API routes immediately or focus on DAL first?
3. Testing framework preference: Vitest or Jest?
4. Monitoring: Self-hosted (PostHog) or third-party (Sentry)?
