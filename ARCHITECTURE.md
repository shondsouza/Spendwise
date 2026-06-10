# SpendWise - Architecture & Design Document

## 🏗️ System Architecture

### Overview

SpendWise is built on a modern, scalable architecture following BigTech engineering standards:

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Frontend (SSR/SSG)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ React Components + TypeScript + Tailwind CSS          │   │
│  │ - Server Components for data fetching                 │   │
│  │ - Client Components for interactivity                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ↓ (fetch/Server Actions)
┌─────────────────────────────────────────────────────────────┐
│         Next.js Server Actions + Middleware Auth            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Server-side validation with Zod                    │   │
│  │ - Direct database mutations                          │   │
│  │ - Session management                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ↓ (SQL)
┌─────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL + Auth + RLS               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Row-Level Security policies                        │   │
│  │ - Real-time subscriptions (optional)                 │   │
│  │ - Auth with JWT tokens                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### Adding an Expense

```
User Form Input
      ↓
React Hook Form validation
      ↓
Submit to Server Action (addExpense)
      ↓
Zod schema validation (backend)
      ↓
Auth check (Supabase)
      ↓
SQL INSERT via Supabase client
      ↓
RLS policy check (auth.uid() = user_id)
      ↓
Revalidate cache + toast notification
      ↓
UI updates via React state
```

### Fetching Dashboard Data

```
Dashboard Page loads (Server Component)
      ↓
getCurrentUser() via Supabase auth
      ↓
Parallel queries for expenses/income
      ↓
Group & aggregate in JavaScript
      ↓
Pass as props to Client Components
      ↓
Recharts renders visualizations
```

---

## 🔐 Security Architecture

### Authentication Flow

```
1. User signs up/logs in
   ↓
2. Supabase generates JWT token
   ↓
3. Middleware intercepts request
   ↓
4. Validates JWT, refreshes if needed
   ↓
5. Sets secure httpOnly cookies
   ↓
6. Next request includes valid session
```

### Row-Level Security (RLS)

Every table has policies:

```sql
CREATE POLICY "Users own their expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);
```

This means:

- Users can ONLY see their own data
- Database enforces this, not just frontend
- Impossible to access other users' data
- Even if auth is compromised, data is safe

### Data Privacy

- ✅ No user IDs in URLs
- ✅ User data fetched server-side
- ✅ JWT never exposed to client
- ✅ API keys stored in environment variables
- ✅ No sensitive data in localStorage
- ✅ Cookies are httpOnly

---

## 🎯 Design Patterns Used

### 1. Server-First Architecture

**Why:** Better performance, security, and SEO

```typescript
// ✅ Server Component - renders on server
export default async function DashboardPage() {
  const data = await fetchExpenses(); // On server
  return <Dashboard data={data} />;    // Send HTML to client
}

// ❌ Avoid - Client-side data fetching
function DashboardPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/expenses') // Slower, less SEO
  }, []);
}
```

### 2. Type-Safe Actions Pattern

```typescript
// ✅ Fully typed end-to-end
export async function addExpense(formData: FormData) {
  const parsed = expenseSchema.safeParse({...});
  return { data: Expense | null, error: string | null };
}

// Client-side usage
const result = await addExpense(formData); // TypeScript knows the type
if (result.error) { /* ... */ }
```

### 3. Separation of Concerns

```
UI Layer (Components)
   ↓
Business Logic Layer (Server Actions)
   ↓
Data Layer (Supabase)
```

No business logic in components, no API calls in actions.

### 4. Form Validation Stack

```
Client: React Hook Form (UX feedback)
   ↓
Server: Zod schema (Security enforcement)
   ↓
Database: CHECK constraints (Last resort)
```

Prevents invalid data at every level.

---

## 📦 Folder Structure Rationale

```
src/
├── app/                     # Next.js routes
│   ├── (auth)/              # Route group - auth pages
│   ├── (dashboard)/         # Route group - protected routes
│   ├── actions/             # Server Actions (no API routes!)
│   ├── layout.tsx           # Root layout
│   └── providers.tsx        # Providers
│
├── components/
│   ├── ui/                  # Reusable UI (button, card, etc)
│   ├── dashboard/           # Feature components
│   ├── expenses/            # Feature components
│   ├── income/              # Feature components
│   ├── analytics/           # Feature components
│   ├── budgets/             # Feature components
│   └── shared/              # Cross-feature components
│
├── lib/
│   ├── supabase/            # Client setup & middleware
│   ├── validations/         # Zod schemas
│   ├── constants/           # App constants
│   └── utils/               # Helpers
│
├── types/                   # TypeScript interfaces
└── middleware.ts            # Auth middleware
```

**Why this structure?**

- Components grouped by feature (scalable)
- UI components separate (reusable)
- Server logic in actions (not routes)
- Utilities in lib (not scattered)

---

## 🔄 State Management

### No Redux! Here's why:

1. **Server State**: Fetched directly on server
2. **URL State**: Managed by `nuqs` (filters, pagination)
3. **Form State**: React Hook Form (local to form)
4. **UI State**: useState (modal open/close, loading)

```typescript
// ✅ Local state for loading
const [loading, setLoading] = useState(false);

// ✅ Form state handled by React Hook Form
const form = useForm<ExpenseFormData>();

// ✅ URL state for filters
const [category] = useQueryState("category");

// ❌ Avoid - global Redux for everything
```

---

## 🚀 Performance Optimizations

### 1. Next.js Caching

```typescript
// Route-level caching (revalidate every 60 seconds)
export const revalidate = 60;

// On-demand revalidation after mutations
revalidatePath("/expenses");
```

### 2. Image Optimization

All images use Next.js Image component (automatic optimization).

### 3. Code Splitting

Components lazy-loaded in route groups - users only download needed JavaScript.

### 4. Database Indexes

```sql
-- Queries are instant
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
```

### 5. Minimal Bundles

- No heavy libraries (date-fns instead of moment)
- Tree-shaking enabled
- CSS utility-first (Tailwind CSS)

---

## 🧪 Testing Strategy

### Unit Tests (Component logic)

```typescript
describe('AmountDisplay', () => {
  it('formats currency correctly', () => {
    render(<AmountDisplay amount={1000} />);
    expect(screen.getByText('₹ 1000.00')).toBeInTheDocument();
  });
});
```

### Integration Tests (Server Actions)

```typescript
describe("addExpense", () => {
  it("creates expense with RLS check", async () => {
    const result = await addExpense(formData);
    expect(result.data).toHaveProperty("id");
  });
});
```

### E2E Tests (User flows)

```typescript
describe("Expense Creation Flow", () => {
  it("user can add and view expense", async () => {
    await page.goto("http://localhost:3000");
    await page.click('[data-testid="add-expense"]');
    // ...
  });
});
```

---

## 📈 Scalability Considerations

### Current Limits

- Single Supabase database (PostgreSQL)
- Suitable for 10,000+ monthly active users
- ~100K expenses/month manageable

### Scaling Strategies (Future)

1. **Database**: Upgrade Supabase tier or migrate to AWS RDS
2. **Caching**: Add Redis for frequently accessed data
3. **CDN**: Vercel Edge Network (automatic with Vercel)
4. **Realtime**: Use Supabase Realtime for live updates
5. **Analytics**: Implement PostHog/Mixpanel
6. **Monitoring**: Sentry for error tracking

---

## 🔧 Tech Choices Explained

| Choice              | Why                                                               |
| ------------------- | ----------------------------------------------------------------- |
| **Next.js**         | SSR, SSG, API routes, built-in auth support                       |
| **TypeScript**      | Catch errors before runtime, better DX                            |
| **Tailwind CSS**    | Fast styling, small bundle, design system                         |
| **Supabase**        | PostgreSQL + Auth + RLS + real-time, drop-in Firebase replacement |
| **Server Actions**  | Type-safe mutations, no API layer, built-in error handling        |
| **shadcn/ui**       | Headless components, full customization, accessible               |
| **Zod**             | Runtime validation, TypeScript inference                          |
| **React Hook Form** | Minimal re-renders, great UX, small bundle                        |

---

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs) - Server/Client Components
- [Supabase Docs](https://supabase.com/docs) - Auth, RLS, Real-time
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Advanced types
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility classes

---

## 📝 Code Quality Standards

### TypeScript

```typescript
// ✅ Strict types everywhere
interface Expense {
  id: string;
  amount: number; // Not 'any'
  category: "food" | "transport"; // Union types
}

// ❌ Avoid
let expense: any; // Never use 'any'
```

### ESLint Rules

```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": "error"
}
```

### Component Pattern

```typescript
// ✅ Clear props interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled }: ButtonProps) {
  // Component body
}
```

---

## 🚢 Deployment Checklist

- [ ] All tests passing
- [ ] ESLint zero errors
- [ ] TypeScript zero errors
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Security headers configured
- [ ] Monitoring/logging setup
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed

---

**Built with ❤️ using modern web technologies**
