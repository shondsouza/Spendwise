import { z } from "zod";

export const addMoneyGivenSchema = z.object({
  person_name: z.string().min(1, "Name is required").max(80, "Name too long"),
  amount: z.coerce.number().positive("Amount must be positive"),
  given_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  reason: z.string().max(200, "Reason too long").optional().default(""),
  expected_return: z.string().optional().default(""),
});

export type AddMoneyGivenFormData = z.infer<typeof addMoneyGivenSchema>;

export const addGivenRepaymentSchema = z.object({
  given_id: z.string().uuid("Invalid ID"),
  amount: z.coerce.number().positive("Amount must be positive"),
  received_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  note: z.string().max(200, "Note too long").optional().default(""),
});

export type AddGivenRepaymentFormData = z.infer<typeof addGivenRepaymentSchema>;

export const addMoneyTakenSchema = z
  .object({
    person_name: z.string().min(1, "Name is required").max(80, "Name too long"),
    amount: z.coerce.number().positive("Amount must be positive"),
    taken_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
    reason: z.string().max(200, "Reason too long").optional().default(""),
    due_date: z.string().optional().default(""),
    has_interest: z.preprocess((v) => v === "on", z.boolean().default(false)),
    simple_interest_rate: z.coerce.number().optional(),
    simple_interest_years: z.coerce.number().optional(),
    compound_interest_rate: z.coerce.number().optional(),
    compounding_frequency: z.coerce.number().optional(),
    total_tenure_years: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.has_interest) {
      if (!data.simple_interest_rate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["simple_interest_rate"],
          message: "Simple interest rate is required",
        });
      }
      if (!data.simple_interest_years) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["simple_interest_years"],
          message: "Simple interest years is required",
        });
      }
      if (!data.compound_interest_rate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["compound_interest_rate"],
          message: "Compound interest rate is required",
        });
      }
      if (!data.compounding_frequency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["compounding_frequency"],
          message: "Compounding frequency is required",
        });
      }
      if (!data.total_tenure_years) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["total_tenure_years"],
          message: "Total tenure is required",
        });
      }
      if (
        data.simple_interest_years &&
        data.total_tenure_years &&
        data.total_tenure_years <= data.simple_interest_years
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["total_tenure_years"],
          message: "Total tenure must be greater than simple interest years",
        });
      }
    }
  });

export type AddMoneyTakenFormData = z.infer<typeof addMoneyTakenSchema>;

export const addTakenRepaymentSchema = z.object({
  taken_id: z.string().uuid("Invalid ID"),
  amount: z.coerce.number().positive("Amount must be positive"),
  paid_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  note: z.string().max(200, "Note too long").optional().default(""),
});

export type AddTakenRepaymentFormData = z.infer<typeof addTakenRepaymentSchema>;
