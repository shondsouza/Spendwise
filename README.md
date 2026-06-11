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
