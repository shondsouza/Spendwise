# Spendwise Architecture Analysis

## Executive Summary

Spendwise is a production-grade daily expense tracker built with **Next.js 15, TypeScript, React 18, and Supabase**. It's a **full-stack web application** designed as a Progressive Web App (PWA) for mobile-first usage. The architecture demonstrates solid separation of concerns with a **server-action-driven data flow**, integrated analytics, and sophisticated loan management features.

---

## 1. Project Organization & Folder Structure

### High-Level Structure

```
Spendwise/
├── src/
│   ├── app/                 # Next.js 15 app router
│   ├── components/          # React components (UI & features)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions, validation, DB clients
│   ├── types/               # TypeScript type definitions
│   ├── middleware.ts        # Next.js middleware for auth flow
│   └── service-worker.js    # PWA offline support
├── supabase/                # Database schema & migrations
├── public/                  # Static assets, PWA manifest, service worker
├── package.json             # Dependencies
└── Configuration files      # tsconfig, next.config, tailwind, etc.
```

### Separation of Concerns

**Clear layered architecture:**

| Layer              | Location                           | Purpose                           |
| ------------------ | ---------------------------------- | --------------------------------- |
| **Presentation**   | `src/components/`, `src/app/`      | UI rendering, dialogs, forms      |
| **Business Logic** | `src/app/actions/`                 | Server-side data operations       |
| **Data Access**    | `src/lib/supabase/`                | Database connectivity             |
| **Validation**     | `src/lib/validations/`             | Input validation with Zod schemas |
| **Utilities**      | `src/lib/utils/`, `src/lib/loans/` | Calculation engines, helpers      |
| **Types**          | `src/types/`                       | Centralized type definitions      |
| **Persistence**    | `supabase/`                        | Database schema & migrations      |

---

## 2. Main Features/Modules

### **2.1 Core Expense Management**

- **Module**: `expenses/` + `expense.actions.ts`
- **Components**: `add-expense-dialog.tsx`, `expense-table.tsx`
- **DB Tables**: `expenses`
- **Features**:
  - Add, update, delete expenses
  - Support for multiple payment methods (Cash, UPI, Card, Bank Transfer)
  - Date, amount, category, and notes tracking
  - Full text search by title
  - Timestamp tracking with `created_at`

### **2.2 Income Tracking**

- **Module**: `income/` + `income.actions.ts`
- **Components**: `add-income-dialog.tsx`
- **DB Tables**: `income`
- **Features**:
  - Track various income sources (Salary, Freelance, Investments, Bonus, etc.)
  - Date-based categorization
  - Optional source and notes fields

### **2.3 Budget Management**

- **Module**: `budgets/` + `budget.actions.ts`
- **Components**: `create-budget-dialog.tsx`
- **DB Tables**: `budgets`
- **Features**:
  - Category-based budgets per month
  - Monthly budget repetition with `repeats_monthly` flag
  - Spending vs. budget tracking (via aggregation)
  - Budget upsert pattern for flexibility

### **2.4 Category Management**

- **Module**: `categories/` + `category.actions.ts`
- **Components**: `create-category-dialog.tsx`
- **DB Tables**: `categories`
- **Features**:
  - User-defined custom categories
  - Type support: `expense`, `income`, or `both`
  - Visual customization (emoji, color)
  - Default built-in categories + custom ones
  - Category aliasing system for flexible mapping

### **2.5 Loan Management (Advanced)**

- **Module**: `loans/` + `loan.actions.ts`
- **Components**:
  - `loan-card.tsx`, `loan-analytics.tsx`, `loan-detail-sheet.tsx`
  - `loan-health-score-card.tsx`, `loan-progress-bar.tsx`
  - `amortization-table.tsx`, `loan-simulator.tsx`
- **DB Tables**: `user_loans`, `loan_payments`, `loan_snapshots`
- **Key Features**:
  - **Multi-type support**: Education, Personal, Home, Vehicle, Custom loans
  - **Interest calculations**:
    - Simple Interest (SI) for moratorium periods
    - Compound Interest (CI) for repayment phases
    - EMI (Equated Monthly Installment) calculation
  - **Moratorium support**: Educational loan moratorium phases
  - **Payment tracking**: Categorized payments (EMI, Interest, Prepayment, Lump Sum)
  - **AMI Scheduling**: Month-by-month amortization tables
  - **Health scoring**: AI-driven loan health metrics
  - **Scenario simulation**: "What-if" analysis for loan payoff strategies
  - **Advanced metrics**:
    - Accrued interest tracking
    - Outstanding balance projections
    - Remaining tenure calculations
    - Phase tracking (Moratorium → Repayment → Completed)

### **2.6 Money Given/Borrowed (P2P Lending)**

- **Module**: `money.actions.ts`
- **DB Tables**:
  - `money_given` + `given_repayments` (loans lent)
  - `money_taken` + `taken_repayments` (loans borrowed)
- **Features**:
  - Track money lent to/borrowed from specific people
  - Simple status tracking (Pending, Partially Returned/Repaid, Returned/Repaid)
  - Repayment history per transaction
  - Expected return/due date tracking

### **2.7 Analytics & Insights**

- **Module**: `analytics/` + charts components
- **Components**:
  - `analytics-chart.tsx`, `charts-client.tsx`
  - `spending-chart.tsx`, `expense-category-chart.tsx`
  - `dashboard-hero.tsx`, `summary-cards.tsx`
- **Technologies**: Recharts (charting library)
- **Features**:
  - Monthly expense trends
  - Category-wise spending breakdown
  - Income vs. expense comparison
  - Recent transactions view
  - Dashboard summary with KPIs

### **2.8 Authentication & User Management**

- **Module**: `auth.actions.ts` + `auth/` routes
- **Provider**: Supabase Auth
- **Features**:
  - User authentication (email/password)
  - Session management with cookies
  - User metadata (name, etc.)
  - Protected routes with redirect

### **2.9 Progressive Web App (PWA)**

- **Configuration**: `next-pwa`, manifest.json
- **Files**: `service-worker.js`, `offline.html`
- **Features**:
  - Offline-first capability
  - Add-to-home-screen support
  - Installable as native app
  - Fallback offline page
  - Image and font caching

---

## 3. Data Flow Architecture

### 3.1 Request-Response Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT SIDE (Browser)                                       │
├─────────────────────────────────────────────────────────────┤
│  1. User Form Input (Component)                             │
│     └─> AddExpenseDialog, AddIncomeDialog, etc.             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ VALIDATION (Client-Side)                                    │
├─────────────────────────────────────────────────────────────┤
│  2. Zod Schema Validation                                   │
│     └─> expenseSchema, budgetSchema, loanSchema, etc.       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ SERVER SIDE (Next.js Server Action)                         │
├─────────────────────────────────────────────────────────────┤
│  3. Execute Server Action                                   │
│     └─> addExpense(), createLoan(), updateBudget(), etc.    │
│         (marked with "use server")                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATION CHECK                                        │
├─────────────────────────────────────────────────────────────┤
│  4. Verify User Session                                     │
│     └─> await supabase.auth.getUser()                       │
│         Returns: { user } or null                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼ (if not authorized, return error)
┌─────────────────────────────────────────────────────────────┐
│ DATABASE OPERATION (Supabase)                               │
├─────────────────────────────────────────────────────────────┤
│  5. Execute DB Query with user_id filter                    │
│     └─> supabase.from('expenses')                           │
│         .insert() / .update() / .delete()                   │
│         .eq('user_id', user.id)  (row-level security)       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ CACHE INVALIDATION (ISR/Revalidation)                       │
├─────────────────────────────────────────────────────────────┤
│  6. Revalidate Related Routes                               │
│     └─> revalidatePath('/dashboard/expenses')               │
│         revalidatePath('/dashboard')                        │
│         revalidatePath('/dashboard/budgets')                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE TO CLIENT                                          │
├─────────────────────────────────────────────────────────────┤
│  7. Return { data, error }                                  │
│     └─> Toast notification via Sonner                       │
│         UI re-renders with fresh data                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 State Management Strategy

**Philosophy**: Minimal client-side state, maximum server-rendered content.

- **Server State**: Majority of data (expenses, budgets, loans) fetched server-side
- **Client State**:
  - Form inputs in dialogs (React `useState`)
  - UI toggles (open/close modals, theme)
  - Toast notifications
- **Caching**:
  - Next.js automatic caching of server components
  - Manual revalidation via `revalidatePath()`
- **No Redux/Zustand**: Relies on React 18's server components + Server Actions pattern

### 3.3 Key Data Flow Patterns

#### Pattern 1: CRUD Operations (Expenses, Income, Categories)

```typescript
// Component (Client)
const [loading, setLoading] = useState(false);
const { data, error } = await addExpense(formData);

// Server Action (addExpense)
"use server";
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase.from('expenses').insert(...);
revalidatePath('/dashboard/expenses');
return { data, error };
```

#### Pattern 2: Complex Calculations (Loans)

```typescript
// Server Action (createLoan)
1. Parse & validate input
2. Compute moratorium end date
3. Calculate outstanding balance (with SI projection)
4. Auto-calculate EMI from tenure + rate
5. Insert into DB
6. Revalidate affected paths
```

#### Pattern 3: Dashboard Aggregation

```typescript
// Server Component (DashboardPage)
const [expenses, income, budgets] = await Promise.all([
  supabase.from('expenses').select(...),
  supabase.from('income').select(...),
  supabase.from('budgets').select(...),
]);

// Pass to client components for rendering
<ChartsClient data={expenses} />
<SummaryCards {...metrics} />
```

### 3.4 Component Hierarchy

```
app/layout.tsx (Root Layout + Providers)
│
├─ app/providers.tsx (ThemeProvider, Toaster, PWA Splash)
│
└─ app/dashboard/layout.tsx (Protected Dashboard Shell)
   │
   ├─ dashboard-shell.tsx (Sidebar, Navigation)
   │
   ├─ page.tsx (Dashboard Home)
   │  ├─ SummaryCards (KPIs)
   │  ├─ ChartsClient (Recharts)
   │  ├─ RecentTransactions
   │  └─ MobileDashboard (Responsive)
   │
   ├─ expenses/page.tsx
   │  ├─ AddExpenseDialog
   │  └─ ExpenseTable
   │
   ├─ budgets/page.tsx
   │  ├─ CreateBudgetDialog
   │  └─ BudgetCards
   │
   ├─ loans/page.tsx
   │  ├─ LoanCard (Preview)
   │  ├─ AddLoanDialog
   │  └─ LoanDashboardWidget
   │
   └─ analytics/page.tsx
      ├─ SpendingChart
      └─ ExpenseCategoryChart
```

---

## 4. Database Schema & Data Models

### 4.1 Schema Overview

**User-Scoped Design**: All tables include `user_id` with CASCADE delete for data isolation.

#### Core Tables

##### `expenses`

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL (≤100 chars),
  amount NUMERIC(10,2) NOT NULL (>0),
  category TEXT NOT NULL (≤40 chars),
  date DATE NOT NULL (defaults to TODAY),
  notes TEXT (≤300 chars),
  payment_method ENUM ('Cash', 'UPI', 'Card', 'Bank Transfer'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX: (user_id, date DESC)
);
```

##### `income`

```sql
CREATE TABLE income (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL (≤100 chars),
  amount NUMERIC(10,2) NOT NULL (>0),
  category TEXT NOT NULL (≤40 chars),
  date DATE NOT NULL,
  notes TEXT (≤300 chars),
  source TEXT (≤60 chars),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### `budgets`

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL (≤40 chars),
  amount NUMERIC(10,2) NOT NULL (>0),
  month SMALLINT (1-12),
  year SMALLINT (2020-2100),
  repeats_monthly BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE CONSTRAINT: (user_id, category, month, year)
);
```

##### `categories`

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL (≤40 chars),
  type ENUM ('expense', 'income', 'both'),
  emoji TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6e6e73',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE CONSTRAINT: (user_id, name)
);
```

#### Loan Management Tables

##### `user_loans` (Core Loan Record)

```sql
CREATE TABLE user_loans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  loan_name TEXT NOT NULL,
  lender_name TEXT NOT NULL,
  loan_type ENUM ('education', 'personal', 'home', 'vehicle', 'custom'),

  -- Principal Tracking
  original_principal NUMERIC NOT NULL,
  current_outstanding NUMERIC NOT NULL,
  outstanding_as_of_date DATE,  -- null = derive dynamically
  accrued_interest NUMERIC DEFAULT 0,
  total_interest_paid NUMERIC DEFAULT 0,
  total_principal_paid NUMERIC DEFAULT 0,
  bank_emi_amount NUMERIC,  -- user-supplied for validation

  -- Interest Configuration
  interest_type ENUM ('simple', 'compound', 'hybrid'),
  interest_rate NUMERIC NOT NULL (% annual),

  -- Dates
  loan_start_date DATE NOT NULL,
  loan_end_date DATE,

  -- Moratorium (Education loans)
  moratorium_course_start DATE,
  moratorium_course_end DATE,
  grace_period_months INT DEFAULT 6,
  moratorium_si_rate NUMERIC,  -- SI during moratorium
  moratorium_end_date DATE,

  -- Repayment/EMI
  emi_start_date DATE,
  emi_amount NUMERIC,
  loan_tenure_months INT,
  ci_rate NUMERIC (for compound phase),
  compounding_frequency ENUM ('monthly', 'quarterly', 'yearly'),

  -- Status
  status ENUM ('active', 'closed', 'defaulted'),
  notes TEXT,
  disbursements JSONB,  -- [{date, amount, description}]

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

##### `loan_payments` (Payment Records)

```sql
CREATE TABLE loan_payments (
  id UUID PRIMARY KEY,
  loan_id UUID REFERENCES user_loans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_type ENUM ('emi', 'interest', 'prepayment', 'lump_sum'),

  principal_component NUMERIC NOT NULL,
  interest_component NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,

  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### `loan_snapshots` (Historical Tracking)

```sql
CREATE TABLE loan_snapshots (
  id UUID PRIMARY KEY,
  loan_id UUID REFERENCES user_loans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  snapshot_date DATE NOT NULL,
  outstanding_balance NUMERIC NOT NULL,
  total_interest_paid NUMERIC NOT NULL,
  total_principal_paid NUMERIC NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### P2P Lending Tables

##### `money_given` / `given_repayments`

```sql
CREATE TABLE money_given (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL (≤80),
  amount NUMERIC(10,2) NOT NULL,
  given_date DATE DEFAULT TODAY,
  reason TEXT (≤200),
  expected_return DATE,
  status ENUM ('Pending', 'Partially Returned', 'Returned'),
  created_at TIMESTAMPTZ
);

CREATE TABLE given_repayments (
  id UUID PRIMARY KEY,
  given_id UUID REFERENCES money_given(id) ON DELETE CASCADE,
  user_id UUID,
  amount NUMERIC(10,2) NOT NULL,
  received_date DATE DEFAULT TODAY,
  note TEXT (≤200),
  created_at TIMESTAMPTZ
);
```

##### `money_taken` / `taken_repayments`

```sql
CREATE TABLE money_taken (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL (≤80),
  amount NUMERIC(10,2) NOT NULL,
  taken_date DATE DEFAULT TODAY,
  reason TEXT (≤200),
  due_date DATE,
  status ENUM ('Pending', 'Partially Repaid', 'Repaid'),
  created_at TIMESTAMPTZ
);

CREATE TABLE taken_repayments (
  id UUID PRIMARY KEY,
  taken_id UUID REFERENCES money_taken(id) ON DELETE CASCADE,
  user_id UUID,
  amount NUMERIC(10,2) NOT NULL,
  paid_date DATE DEFAULT TODAY,
  note TEXT (≤200),
  created_at TIMESTAMPTZ
);
```

### 4.2 Type Definitions

**Core Types** (`src/types/index.ts`):

```typescript
interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // ISO date
  notes?: string;
  payment_method: "Cash" | "UPI" | "Card" | "Bank Transfer";
  created_at: string;
}

interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  repeats_monthly?: boolean;
  created_at: string;
}

interface Category {
  id: string;
  user_id: string;
  name: string;
  type: "expense" | "income" | "both";
  emoji: string;
  color: string;
  created_at: string;
}
```

**Loan Types** (`src/types/loan.types.ts`):

```typescript
interface UserLoan {
  // Basic identifiers
  id: string;
  user_id: string;
  loan_name: string;
  lender_name: string;
  loan_type: "education" | "personal" | "home" | "vehicle" | "custom";

  // Financial tracking
  original_principal: number;
  current_outstanding: number;
  outstanding_as_of_date: string | null;
  accrued_interest: number;

  // Interest config
  interest_type: "simple" | "compound" | "hybrid";
  interest_rate: number;

  // Dates
  loan_start_date: string;
  moratorium_course_end: string | null;
  moratorium_end_date: string | null;
  emi_start_date: string | null;

  // EMI
  emi_amount: number | null;
  loan_tenure_months: number | null;

  // Status
  status: "active" | "closed" | "defaulted";
  disbursements: Disbursement[] | null;

  created_at: string;
  updated_at: string;
}

// Computed type for display
interface LoanBalance {
  originalPrincipal: number;
  currentOutstanding: number;
  accruedInterest: number;
  remainingBalance: number;
  repaymentPercent: number; // 0-100
  phase: "moratorium" | "repayment" | "completed" | "not_started";
  phaseLabel: string;
  estimatedPayoffDate: string | null;
  calculatedEmi: number | null;
  emiDifferencePercent: number | null;
}

interface EMIScheduleRow {
  month: number;
  date: string;
  openingBalance: number;
  emi: number;
  principalComponent: number;
  interestComponent: number;
  closingBalance: number;
  isPaid?: boolean;
}
```

### 4.3 Data Relationships

```
User (Supabase Auth)
│
├─ expenses (1:N)
├─ income (1:N)
├─ budgets (1:N)
├─ categories (1:N)
├─ money_given (1:N)
│  └─ given_repayments (1:N)
├─ money_taken (1:N)
│  └─ taken_repayments (1:N)
└─ user_loans (1:N)
   ├─ loan_payments (1:N)
   └─ loan_snapshots (1:N)
```

### 4.4 Query Patterns

**Multi-fetch pattern** (DashboardPage):

```typescript
const [todayExpenses, monthExpenses, monthIncome, recentExpenses] =
  await Promise.all([
    supabase.from('expenses').select('amount')
      .eq('user_id', user.id)
      .eq('date', todayDate),
    supabase.from('expenses').select('amount, category, date')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd),
    ...
  ]);
```

**Aggregation**: Uses SQL views like `monthly_expense_summary` for pre-computed totals.

---

## 5. Dependency Management & External Integrations

### 5.1 Core Dependencies

| Package                   | Version  | Purpose                                  |
| ------------------------- | -------- | ---------------------------------------- |
| **next**                  | ^15.1.0  | React framework + server components      |
| **react**                 | ^18.3.1  | UI library                               |
| **typescript**            | ^5.3.3   | Type safety                              |
| **@supabase/ssr**         | ^0.5.2   | Auth session management                  |
| **@supabase/supabase-js** | ^2.43.4  | Database client                          |
| **recharts**              | ^2.11.0  | Charting library for analytics           |
| **tailwindcss**           | ^3.4.1   | Utility-first CSS                        |
| **radix-ui**              | Latest   | Headless UI components                   |
| **react-hook-form**       | ^7.50.0  | Form state management                    |
| **zod**                   | ^3.22.4  | Schema validation                        |
| **date-fns**              | ^2.30.0  | Date utilities                           |
| **framer-motion**         | ^12.40.0 | Animations                               |
| **sonner**                | ^1.3.1   | Toast notifications                      |
| **decimal.js-light**      | ^2.5.1   | Arbitrary precision decimals (financial) |
| **next-pwa**              | ^5.6.0   | Progressive Web App support              |
| **next-themes**           | ^0.2.1   | Theme provider                           |
| **lucide-react**          | ^0.344.0 | Icon library                             |

### 5.2 Development Dependencies

```json
{
  "@types/react": "18.3.31",
  "@types/node": "20.17.6",
  "eslint": "^8.55.0",
  "prettier": "^3.1.1",
  "husky": "^8.0.3",
  "lint-staged": "^15.2.2"
}
```

### 5.3 External Integrations

#### **Supabase (Backend-as-a-Service)**

- **Auth**: Email/password authentication via Supabase Auth
- **Database**: PostgreSQL via Supabase API
- **Real-time**: Available but not actively used
- **Integration Points**:
  - `src/lib/supabase/server.ts` - Server-side client
  - `src/lib/supabase/client.ts` - Browser-side client
  - `src/lib/supabase/middleware.ts` - Auth flow
  - `src/lib/supabase/fallback-client.ts` - Graceful degradation

#### **Recharts**

- Used for expense charts and analytics
- Components: `spending-chart.tsx`, `expense-category-chart.tsx`, `analytics-chart.tsx`

#### **Decimal.js**

- Ensures accurate financial calculations (no IEEE 754 floating-point errors)
- Used in loan interest calculations

#### **Zod**

- Runtime type validation for all forms
- Schemas: `expense.schema.ts`, `budget.schema.ts`, `loan.schema.ts`, `money.schema.ts`

#### **Framer Motion**

- Smooth animations on components
- Used in modals, transitions

#### **Sonner**

- Toast notifications for user feedback
- Success/error messages after CRUD operations

### 5.4 Configuration

**Environment Variables** (required):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Build Configuration** (`next.config.js`):

```javascript
- PWA plugin setup
- Image remote patterns allowed
- URL redirects (/login → /auth/login)
- Output file tracing
```

---

## 6. Architectural Patterns & Anti-Patterns

### 6.1 Patterns (Strengths)

#### ✅ **Server-Driven Architecture**

- Leverages Next.js 15 server components to minimize client-side JavaScript
- Server Actions eliminate need for API routes for most operations
- Better security (secrets stay server-side)
- Example: Dashboard page fetches data server-side, passes to client components

#### ✅ **Separation of Concerns**

- **Actions layer** (`src/app/actions/`) handles all data mutations
- **Components layer** (`src/components/`) focuses purely on UI/UX
- **Utilities layer** (`src/lib/`) provides calculators and helpers
- **Types layer** (`src/types/`) centralizes all interfaces

#### ✅ **User Isolation (Multi-tenancy)**

- Every query filters by `user_id`
- Supabase RLS (Row-Level Security) enforces at database level
- Cascade delete ensures user data cleanup
- Example: `await supabase.from('expenses').select().eq('user_id', user.id)`

#### ✅ **Zod Validation**

- Runtime schema validation on server and client
- Consistent error messages
- Type inference: `type ExpenseFormData = z.infer<typeof expenseSchema>`

#### ✅ **ISR + Revalidation Pattern**

- `revalidatePath()` invalidates cache on mutations
- Keeps data fresh without database polling
- Fine-grained control over which routes revalidate

#### ✅ **Type Safety with TypeScript**

- Strict mode enabled
- Centralized type definitions reduce duplication
- Prevents entire categories of bugs

#### ✅ **PWA-First Design**

- Offline support via service worker
- Installable on mobile
- Manifest.json for branding
- Good for low-connectivity scenarios

#### ✅ **Sophisticated Loan Math**

- Separate calculation modules for different interest types
- Amortization table generation
- Moratorium phase handling
- Scenario simulation engine

### 6.2 Potential Anti-Patterns & Weaknesses

#### ⚠️ **Tight Coupling in Loan Calculations**

**Issue**: Complex loan math spread across multiple files without clear abstraction boundaries

- `emi-calculator.ts`, `education-loan-calculator.ts`, `loan-health-score.ts`, `loan-projection-engine.ts`
- No single source of truth for calculation logic
- Different functions may compute the same thing slightly differently

**Risk**:

- Difficult to test (no central test suite visible)
- Easy to introduce calculation bugs
- Maintenance burden when loan logic changes

**Recommendation**: Create a `LoanEngine` class that encapsulates all calculations, with comprehensive unit tests.

#### ⚠️ **Direct Supabase Calls in Actions**

**Issue**: Each server action creates a new Supabase client and checks auth independently

```typescript
// Repeated in every action
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) return { data: null, error: "Unauthorized" };
```

**Better**: Middleware could extract user and pass via context parameter.

#### ⚠️ **Manual Revalidation**

**Issue**: Easy to forget revalidatePath calls, leaving stale data

```typescript
revalidatePath("/dashboard/expenses");
revalidatePath("/dashboard/budgets");
revalidatePath("/dashboard"); // might miss some paths
```

**Risk**: If a developer adds a new view, they must remember to add revalidation.

**Recommendation**: Use a `revalidateRelated()` helper that automatically invalidates all related routes.

#### ⚠️ **Limited Error Handling in Components**

**Issue**: Many components assume successful responses; errors are shown as toasts but not deeply investigated

```typescript
const { data, error } = await addExpense(formData);
if (error) {
  toast.error(error);
  return;
}
```

**Risk**: Silent failures, poor UX for network issues.

#### ⚠️ **No Optimistic UI Updates**

**Issue**: Users wait for server response before seeing changes

- Add expense → loading spinner → confirmation
- No optimistic UI pattern (React Query's `onMutate`)

**Better**: Show expense in list immediately, revert if error.

#### ⚠️ **Loan Calculation Test Coverage**

**Issue**: Only `loan-interest.test.ts` and `emi-calculator.test.ts` visible; comprehensive test coverage unclear.

**Risk**: Edge cases (edge dates, boundary amounts) not caught.

#### ⚠️ **No GraphQL**

**Issue**: Over-fetching of data; each page fetches more fields than needed

```typescript
supabase.from("expenses").select("*"); // Gets all fields
```

**Better**: Would benefit from GraphQL or field-level projection APIs.

#### ⚠️ **Category Aliasing Logic**

**Issue**: Custom category mapping system (`category-aliases.ts`) adds complexity

```typescript
function buildCategoryAliasMap() { ... }
function getCategoryAliases() { ... }
function getCanonicalCategory() { ... }
```

**Risk**: Difficult to debug; not documented clearly.

#### ⚠️ **FormData as Transport**

**Issue**: Server actions use FormData instead of JSON

```typescript
const addExpense = async (formData: FormData) => {
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
```

**Reason**: Good for progressive enhancement, but loses IDE type hints.

**Better**: Consider using form actions with `next/form` + JSON transport for better DX.

#### ⚠️ **No Caching Strategy for Expensive Queries**

**Issue**: Dashboard queries run on every page load

```typescript
const [todayExpensesData, monthExpensesData] = await Promise.all([...]);
```

**Better**: Cache summaries using Next.js cache with appropriate TTL.

---

## 7. Architectural Strengths Summary

### Core Strengths:

1. **Clean Separation of Layers** - Actions, components, types all have clear boundaries
2. **Type-Safe** - Comprehensive TypeScript + Zod validation
3. **Secure by Default** - Server-side auth checks, user_id filters, RLS-ready
4. **Modern React** - Server components reduce JS payload and improve performance
5. **Progressive Enhancement** - PWA-ready, works offline
6. **Sophisticated Loan System** - Deep financial calculations for multiple loan types
7. **User Isolation** - Multi-tenant safe with proper data scoping
8. **Responsive Design** - Mobile-first with Tailwind CSS

### Areas for Improvement:

1. Consolidate loan math into cohesive engine
2. Abstract auth/user checks into reusable middleware
3. Implement optimistic UI updates
4. Centralize revalidation logic
5. Add comprehensive test coverage (especially loan calculations)
6. Better error boundaries and recovery mechanisms
7. Consider caching strategy for expensive aggregations

---

## 8. Key Architectural Files Reference

| File                                                                           | Purpose                       |
| ------------------------------------------------------------------------------ | ----------------------------- |
| [src/middleware.ts](src/middleware.ts)                                         | Auth session middleware       |
| [src/app/layout.tsx](src/app/layout.tsx)                                       | Root layout + metadata        |
| [src/app/providers.tsx](src/app/providers.tsx)                                 | Theme + toast + PWA providers |
| [src/app/actions/expense.actions.ts](src/app/actions/expense.actions.ts)       | Expense CRUD                  |
| [src/app/actions/loan.actions.ts](src/app/actions/loan.actions.ts)             | Loan management               |
| [src/lib/supabase/server.ts](src/lib/supabase/server.ts)                       | Server DB client              |
| [src/lib/validations/expense.schema.ts](src/lib/validations/expense.schema.ts) | Input validation              |
| [src/lib/loans/emi-calculator.ts](src/lib/loans/emi-calculator.ts)             | EMI math engine               |
| [src/types/index.ts](src/types/index.ts)                                       | Core type definitions         |
| [src/types/loan.types.ts](src/types/loan.types.ts)                             | Loan type definitions         |
| [supabase/schema.sql](supabase/schema.sql)                                     | Database schema               |
| [next.config.js](next.config.js)                                               | PWA configuration             |
| [tailwind.config.ts](tailwind.config.ts)                                       | Styling configuration         |

---

## 9. Data Security Considerations

### ✅ Implemented:

- Server-side user verification in every action
- Database user_id filtering on all queries
- CASCADE delete for data cleanup
- FormData instead of JSON (CSRF protection)
- Supabase RLS ready (though specific policies not shown)

### ⚠️ To Verify:

- SQL injection protection (Supabase parameterized queries do this)
- CORS configuration
- Rate limiting on Supabase
- Sensitive data in URLs (dates/IDs)
- Audit logging for financial transactions

---

## Conclusion

Spendwise is a **well-structured, modern expense tracking application** with sophisticated financial features, particularly in loan management. The architecture demonstrates solid software engineering practices with clear separation of concerns, type safety, and secure data handling. The main opportunities for improvement are in consolidating complex loan calculations, improving error handling, and implementing optimistic UI patterns for better user experience.

The project is production-ready for a personal finance application and could serve as a reference implementation for Next.js 15 + Supabase applications.
