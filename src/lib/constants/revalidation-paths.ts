/**
 * Centralized Revalidation Path Registry
 *
 * Single source of truth for all revalidation paths.
 * Prevents cache invalidation bugs by centralizing path definitions.
 *
 * Usage:
 * ```typescript
 * import { REVALIDATION_PATHS } from '@/lib/constants/revalidation-paths';
 *
 * await revalidatePath(REVALIDATION_PATHS.DASHBOARD);
 * await revalidatePath(REVALIDATION_PATHS.EXPENSES.LIST);
 * ```
 */

export const REVALIDATION_PATHS = {
  // Dashboard & Main Pages
  DASHBOARD: "/dashboard",
  DASHBOARD_LOADING: "/dashboard/loading",

  // Expense Management
  EXPENSES: {
    LIST: "/dashboard/expenses",
    DETAIL: "/dashboard/expenses/[id]",
    ARCHIVE: "/dashboard/expenses/archive",
  },

  // Income Management
  INCOME: {
    LIST: "/dashboard/income",
    DETAIL: "/dashboard/income/[id]",
  },

  // Budget Management
  BUDGETS: {
    LIST: "/dashboard/budgets",
    DETAIL: "/dashboard/budgets/[id]",
  },

  // Category Management
  CATEGORIES: {
    LIST: "/dashboard/categories",
    DETAIL: "/dashboard/categories/[id]",
  },

  // Loan Management
  LOANS: {
    DASHBOARD: "/dashboard/loan",
    LIST: "/dashboard/loan/list",
    DETAIL: "/dashboard/loan/[id]",
    ANALYTICS: "/dashboard/loan/analytics",
    SIMULATOR: "/dashboard/loan/simulator",
  },

  // P2P Lending
  MONEY: {
    GIVEN: "/dashboard/money/given",
    TAKEN: "/dashboard/money/taken",
  },

  // Settings
  SETTINGS: {
    PROFILE: "/dashboard/settings/profile",
    PREFERENCES: "/dashboard/settings/preferences",
    CATEGORIES: "/dashboard/settings/categories",
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: "/dashboard/analytics",
    REPORTS: "/dashboard/analytics/reports",
  },

  // Auth Pages
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },

  // Root paths
  ROOT: "/",
  ROOT_SITEMAP: "/sitemap.xml",
  ROOT_ROBOTS: "/robots.txt",
} as const;

/**
 * Get all paths that should be revalidated after a data change.
 * Useful for knowing what caches to invalidate after an action.
 *
 * Examples:
 * - Expense created → revalidate DASHBOARD, EXPENSES.LIST
 * - Budget updated → revalidate BUDGETS.LIST, ANALYTICS.DASHBOARD
 * - Loan created → revalidate LOANS.DASHBOARD, ANALYTICS.DASHBOARD
 */
export function getRelatedRevalidationPaths(
  entityType: "expense" | "income" | "budget" | "loan" | "money" | "category"
): string[] {
  switch (entityType) {
    case "expense":
      return [
        REVALIDATION_PATHS.DASHBOARD,
        REVALIDATION_PATHS.EXPENSES.LIST,
        REVALIDATION_PATHS.ANALYTICS.DASHBOARD,
      ];

    case "income":
      return [
        REVALIDATION_PATHS.DASHBOARD,
        REVALIDATION_PATHS.INCOME.LIST,
        REVALIDATION_PATHS.ANALYTICS.DASHBOARD,
      ];

    case "budget":
      return [REVALIDATION_PATHS.BUDGETS.LIST, REVALIDATION_PATHS.ANALYTICS.DASHBOARD];

    case "loan":
      return [
        REVALIDATION_PATHS.DASHBOARD,
        REVALIDATION_PATHS.LOANS.DASHBOARD,
        REVALIDATION_PATHS.LOANS.LIST,
        REVALIDATION_PATHS.ANALYTICS.DASHBOARD,
      ];

    case "money":
      return [
        REVALIDATION_PATHS.MONEY.GIVEN,
        REVALIDATION_PATHS.MONEY.TAKEN,
        REVALIDATION_PATHS.DASHBOARD,
      ];

    case "category":
      return [
        REVALIDATION_PATHS.CATEGORIES.LIST,
        REVALIDATION_PATHS.DASHBOARD,
        REVALIDATION_PATHS.EXPENSES.LIST,
        REVALIDATION_PATHS.INCOME.LIST,
      ];

    default:
      return [REVALIDATION_PATHS.DASHBOARD];
  }
}

/**
 * Revalidates all related paths for an entity type.
 * Use this in server actions to ensure all affected pages are updated.
 *
 * Usage:
 * ```typescript
 * export const addExpense = protectedAction(async (userId, formData) => {
 *   // ... add expense ...
 *   await revalidateRelatedPaths('expense');
 * });
 * ```
 */
export async function revalidateRelatedPaths(
  entityType: "expense" | "income" | "budget" | "loan" | "money" | "category"
) {
  const { revalidatePath } = await import("next/cache");
  const paths = getRelatedRevalidationPaths(entityType);

  for (const path of paths) {
    revalidatePath(path);
  }
}
