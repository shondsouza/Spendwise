# SpendWise - Daily Expense Tracker

A production-grade daily expense tracking web application built with modern web technologies.

SpendWise is a fast and intuitive expense tracking application that helps you manage your finances. Track your spending, monitor income, set budgets, and gain insights into your financial habits with stunning visualizations.

## Authentication

SpendWise uses Supabase email and password authentication for existing users.
New accounts are created and managed separately in Supabase. Configure these
Supabase **Authentication > URL Configuration** values:

- **Site URL:** `https://spendwiseshon.vercel.app`
- **Redirect URLs:** `https://spendwiseshon.vercel.app/auth/callback` and
  `http://localhost:3000/auth/callback`

The login page uses `signInWithPassword`. Email confirmation remains enforced
by Supabase, so only confirmed users can access the dashboard and application
data.
