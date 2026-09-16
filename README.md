# SpendWise - Daily Expense Tracker

A production-grade daily expense tracking web application built with modern web technologies.

SpendWise is a fast and intuitive expense tracking application that helps you manage your finances. Track your spending, monitor income, set budgets, and gain insights into your financial habits with stunning visualizations.

## Authentication

SpendWise uses Supabase email and password authentication. New users receive
an email confirmation link before they can sign in. Configure these Supabase
**Authentication > URL Configuration** values:

- **Site URL:** `https://spendwiseshon.vercel.app`
- **Redirect URLs:** `https://spendwiseshon.vercel.app/auth/callback` and
  `http://localhost:3000/auth/callback`

The login page uses `signUp` for registration and `signInWithPassword` for
login. The callback route exchanges the email confirmation code for a session.
