import { z } from "zod";

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required").max(40, "Category too long"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  payment_method: z.enum(["Cash", "UPI", "Card", "Bank Transfer"]),
  notes: z.string().max(300, "Notes must be 300 characters or less").optional().default(""),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export const incomeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required").max(40, "Category too long"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  source: z.string().max(60, "Source must be 60 characters or less").optional().default(""),
  notes: z.string().max(300, "Notes must be 300 characters or less").optional().default(""),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;

export const budgetSchema = z.object({
  category: z.string().min(1, "Category is required").max(40, "Category too long"),
  amount: z.coerce.number().positive("Amount must be positive"),
  month: z.coerce.number().int().min(1, "Invalid month").max(12, "Invalid month").optional(),
  year: z.coerce.number().int().min(2020, "Invalid year").max(2100, "Invalid year").optional(),
  repeats_monthly: z
    .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on"), z.literal("1"), z.literal("0")])
    .optional()
    .transform((value) => {
      if (value === undefined) return true;
      if (typeof value === "boolean") return value;
      return value === "true" || value === "on" || value === "1";
    }),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(40, "Name too long"),
  type: z.enum(["expense", "income", "both"]),
  emoji: z.string().min(1, "Emoji is required").default("📁"),
  color: z.string().min(1, "Color is required").default("#6e6e73"),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
