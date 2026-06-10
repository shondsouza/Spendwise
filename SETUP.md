# 🚀 SpendWise Setup Guide

Complete guide to get SpendWise running locally and deploy to production.

## Prerequisites

- Node.js 18+ installed ([download](https://nodejs.org/))
- npm or pnpm package manager
- Git installed
- A Supabase account ([create free account](https://supabase.com))

## ⚡ Quick Start (5 Minutes)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd spendwise
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and set password
4. Wait for project to initialize

### 3. Run SQL Schema

In Supabase Dashboard → SQL Editor, paste and run:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_category ON expenses(user_id, category);
CREATE INDEX idx_income_user_date ON income(user_id, date DESC);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their income" ON income
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN
  NEW.updated_at = NOW(); RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER income_updated_at BEFORE UPDATE ON income
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4. Get API Keys

1. Go to Settings → API in Supabase
2. Copy `Project URL` and `anon key`
3. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` → Sign up → Start tracking expenses!

---

## 📦 Production Deployment

### Deploy to Vercel (Recommended)

Vercel is perfect for Next.js apps - deploys in 2 minutes.

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel auto-detects Next.js settings

#### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL = your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_key
NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
```

#### Step 4: Deploy

Click "Deploy" - your app is live in ~60 seconds!

**Custom Domain:**
1. Domain settings → Add custom domain
2. Update DNS records (instructions shown)
3. SSL auto-issued in ~5 minutes

### Deploy to Other Platforms

#### Railway

```bash
railway init
railway up
```

Set environment variables in Railway dashboard.

#### Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables
5. Deploy

#### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t spendwise .
docker run -p 3000:3000 -e NEXT_PUBLIC_SUPABASE_URL=... spendwise
```

---

## 🔧 Development

### Available Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Build for production
npm start            # Run production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # Check TypeScript
```

### Project Structure

```
src/
├── app/              # Next.js app router
├── components/       # React components
├── lib/              # Utilities and configs
├── types/            # TypeScript types
└── middleware.ts     # Auth middleware
```

### Adding Features

1. Create types in `src/types/`
2. Create Zod schema in `src/lib/validations/`
3. Create server action in `src/app/actions/`
4. Create components in `src/components/`
5. Create page in `src/app/(dashboard)/`

### Database Migrations

For schema changes:

1. Update SQL in Supabase SQL Editor
2. Update TypeScript types
3. Update Zod schemas
4. Test locally with `npm run dev`

---

## 🐛 Troubleshooting

### "Cannot find module" error

```bash
npm install
rm -rf node_modules .next
npm install
npm run dev
```

### Supabase connection error

- Check `.env.local` has correct keys
- Verify project is active in Supabase dashboard
- Confirm database tables exist

### Build errors

```bash
npm run type-check  # Find TypeScript errors
npm run lint        # Find linting issues
```

### Dark mode not working

```bash
# Clear cache
rm -rf .next
npm run dev
```

---

## 🔒 Security Checklist

- [ ] Environment variables in `.env.local` (not committed)
- [ ] Row-Level Security policies enabled in Supabase
- [ ] Only use `anon` key in browser (not `service_role`)
- [ ] All mutations via Server Actions (no API routes)
- [ ] TypeScript strict mode enabled
- [ ] No console.log of sensitive data

---

## 📈 Performance Tips

1. **Images**: Optimize with Next.js Image component
2. **Database**: Use indexes (already done)
3. **Caching**: Leverage Next.js ISR for dashboards
4. **Code**: Tree-shake unused imports
5. **Monitoring**: Use Vercel Analytics

---

## 🆘 Support

- **Docs**: Read [README.md](README.md)
- **Errors**: Check console and network tab
- **Issues**: Search existing GitHub issues
- **Community**: Ask in Supabase Discord

---

## 📝 Next Steps After Setup

1. ✅ Create account and sign in
2. ✅ Add your first expense
3. ✅ Set a budget
4. ✅ Check analytics
5. ✅ Customize settings
6. ✅ Share with friends!

**Enjoy tracking your finances with SpendWise!** 🚀
