# SpendWise - Daily Expense Tracker

A production-grade daily expense tracking web application built with modern web technologies following BigTech engineering standards.

## 🎯 Overview

SpendWise is a beautiful, fast, and intuitive expense tracking application that helps you manage your finances. Track your spending, monitor income, set budgets, and gain insights into your financial habits with stunning visualizations.

**Live Demo**: [Deploy to Vercel](#)  
**Documentation**: [Read the full docs](#)

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Static type checking
- **Tailwind CSS 3** - Utility-first CSS
- **shadcn/ui** - High-quality UI components
- **Recharts** - Data visualization
- **React Hook Form + Zod** - Form handling & validation
- **next-themes** - Dark/Light mode support
- **nuqs** - URL state management

### Backend & Database

- **Supabase** - PostgreSQL database with Auth & RLS
- **@supabase/ssr** - Server-side authentication
- **Next.js Server Actions** - Backend operations

### Code Quality

- **TypeScript** - Strict mode, no `any` types
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks

## 📋 Features

### ✨ Core Features

- **Dashboard** - Real-time financial overview with charts and summaries
- **Expenses** - Full CRUD operations with category-based filtering
- **Income** - Track multiple income sources
- **Analytics** - Monthly trends, category breakdown, spending insights
- **Budgets** - Set and monitor category-wise spending limits
- **Settings** - Profile management, preferences, theme switching

### 🔐 Authentication & Security

- Email/password authentication via Supabase
- Row-Level Security (RLS) policies
- Protected routes with middleware
- Automatic session management

### 🎨 UI/UX

- Pixel-perfect design following modern design principles
- Dark/Light mode support
- Fully responsive (mobile-first)
- Loading & error states
- Toast notifications
- Empty states

## 📦 Installation

### Prerequisites

- Node.js 18+ & npm/pnpm
- Supabase account

### Step 1: Clone & Install

```bash
git clone <repository>
cd spendwise
npm install
```

### Step 2: Set Up Supabase

1. Create a new Supabase project
2. Copy the following SQL into the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  payment_method TEXT DEFAULT 'Cash',
  is_recurring BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income table
CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_category ON expenses(user_id, category);
CREATE INDEX idx_income_user_date ON income(user_id, date DESC);

-- Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their income" ON income
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN
  NEW.updated_at = NOW(); RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER income_updated_at BEFORE UPDATE ON income
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Step 3: Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get these values from Supabase Dashboard → Settings → API.

### Step 4: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and sign up for a new account.

## 📂 Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard
│   │   ├── expenses/page.tsx
│   │   ├── income/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── budgets/page.tsx
│   │   └── settings/page.tsx
│   ├── actions/
│   │   ├── expense.actions.ts
│   │   ├── income.actions.ts
│   │   └── budget.actions.ts
│   ├── layout.tsx
│   └── providers.tsx
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard/               # Dashboard components
│   ├── expenses/                # Expense-related components
│   ├── income/                  # Income-related components
│   ├── analytics/               # Analytics components
│   ├── budgets/                 # Budget components
│   └── shared/                  # Shared components
├── lib/
│   ├── supabase/               # Supabase client setup
│   ├── validations/            # Zod schemas
│   ├── constants/              # Constants
│   └── utils/                  # Utility functions
├── types/
│   └── index.ts                # TypeScript types
└── middleware.ts               # Auth middleware
```

## 🚀 Usage

### Create an Expense

1. Go to Expenses page
2. Click "Add Expense"
3. Fill in details and submit

### Set a Budget

1. Go to Budgets page
2. Click "Create Budget"
3. Select category, amount, and period
4. Monitor progress on the card

### View Analytics

- Dashboard shows quick overview
- Analytics page has detailed insights
- Charts auto-update with new data

## 🔨 Development

### Run Tests

```bash
npm run lint
npm run type-check
```

### Build for Production

```bash
npm run build
npm start
```

### Format Code

```bash
npm run format
```

## 📊 Database Schema

### Expenses

- id, user_id, title, amount, category
- date, notes, payment_method, is_recurring, tags
- created_at, updated_at

### Income

- id, user_id, title, amount, category
- date, notes, source
- created_at, updated_at

### Budgets

- id, user_id, category, amount, period
- start_date, end_date, created_at

All tables have Row-Level Security enabled for data privacy.

## 🔒 Security

- ✅ All mutations via Server Actions (no exposed API routes)
- ✅ Row-Level Security (RLS) policies for all tables
- ✅ Session management via Supabase middleware
- ✅ Protected routes with auth checks
- ✅ Environment variables for sensitive data
- ✅ No `any` TypeScript types

## 🎨 Design System

### Colors

- Primary: Indigo (#6366f1)
- Success: Emerald (#10b981)
- Danger: Rose (#f43f5e)
- Warning: Amber (#f59e0b)

### Typography

- Font: Inter (Google Fonts)
- Monospace amounts with tabular-nums

### Components

- All built with shadcn/ui + Radix UI
- Consistent spacing and sizing
- Accessible color contrast

## 📱 Responsive Design

- Mobile-first approach
- Tested on 375px width
- Sidebar collapses on mobile
- All forms mobile-friendly
- Touch-friendly buttons

## 🚢 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.

### Other Platforms

Works on any platform supporting Node.js 18+:

- Netlify
- Railway
- Heroku
- Docker

## 🤝 Contributing

This is a demo/portfolio project. For improvements:

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Submit a pull request

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🙋 Support

For issues or questions:

- Check existing issues on GitHub
- Create a new issue with details
- Email: support@spendwise.app

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

Built with ❤️ using modern web technologies
