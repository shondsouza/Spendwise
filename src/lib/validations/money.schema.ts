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

export const addMoneyTakenSchema = z.object({
  person_name: z.string().min(1, "Name is required").max(80, "Name too long"),
  amount: z.coerce.number().positive("Amount must be positive"),
  taken_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  reason: z.string().max(200, "Reason too long").optional().default(""),
  due_date: z.string().optional().default(""),
});

export type AddMoneyTakenFormData = z.infer<typeof addMoneyTakenSchema>;

export const addTakenRepaymentSchema = z.object({
  taken_id: z.string().uuid("Invalid ID"),
  amount: z.coerce.number().positive("Amount must be positive"),
  paid_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  note: z.string().max(200, "Note too long").optional().default(""),
});

export type AddTakenRepaymentFormData = z.infer<typeof addTakenRepaymentSchema>;
