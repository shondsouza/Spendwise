"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Budget, Category, Expense, Income } from "@/types";
import type { LoanPayment, UserLoan } from "@/types/loan.types";
import type {
  GivenRepayment,
  MoneyGiven,
  MoneyTaken,
  TakenRepayment,
} from "@/types/money.types";

const STORAGE_KEY = "spendwise_guest_finance_data";
const GUEST_ID = "guest-local";

export interface GuestData {
  expenses: Expense[];
  income: Income[];
  categories: Category[];
  budgets: Budget[];
  loans: UserLoan[];
  loanPayments: LoanPayment[];
  moneyGiven: MoneyGiven[];
  givenRepayments: GivenRepayment[];
  moneyTaken: MoneyTaken[];
  takenRepayments: TakenRepayment[];
}

const emptyData: GuestData = {
  expenses: [],
  income: [],
  categories: [],
  budgets: [],
  loans: [],
  loanPayments: [],
  moneyGiven: [],
  givenRepayments: [],
  moneyTaken: [],
  takenRepayments: [],
};

type GuestDataContextValue = GuestData & {
  isGuest: boolean;
  isReady: boolean;
  saveExpense: (value: Omit<Expense, "id" | "user_id" | "created_at">, id?: string) => Expense;
  deleteExpense: (id: string) => void;
  saveIncome: (value: Omit<Income, "id" | "user_id" | "created_at">, id?: string) => Income;
  deleteIncome: (id: string) => void;
  saveCategory: (
    value: Omit<Category, "id" | "user_id" | "created_at">,
    id?: string
  ) => Category;
  deleteCategory: (id: string) => void;
  saveBudget: (
    value: Omit<Budget, "id" | "user_id" | "created_at">,
    id?: string
  ) => Budget;
  deleteBudget: (id: string) => void;
  saveLoan: (value: Omit<UserLoan, "id" | "user_id" | "created_at" | "updated_at">, id?: string) => UserLoan;
  deleteLoan: (id: string) => void;
  saveLoanPayment: (
    value: Omit<LoanPayment, "id" | "user_id" | "created_at">
  ) => LoanPayment;
  deleteLoanPayment: (id: string) => void;
  saveMoneyGiven: (
    value: Omit<MoneyGiven, "id" | "user_id" | "created_at">,
    id?: string
  ) => MoneyGiven;
  deleteMoneyGiven: (id: string) => void;
  saveGivenRepayment: (
    value: Omit<GivenRepayment, "id" | "user_id" | "created_at">
  ) => GivenRepayment;
  saveMoneyTaken: (
    value: Omit<MoneyTaken, "id" | "user_id" | "created_at">,
    id?: string
  ) => MoneyTaken;
  deleteMoneyTaken: (id: string) => void;
  saveTakenRepayment: (
    value: Omit<TakenRepayment, "id" | "user_id" | "created_at">
  ) => TakenRepayment;
  deleteAll: () => void;
};

const GuestDataContext = createContext<GuestDataContextValue | null>(null);

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

export function GuestDataProvider({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const [data, setData] = useState<GuestData>(emptyData);
  const [isReady, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setData({ ...emptyData, ...JSON.parse(stored) });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setReady(true);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled && isReady) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, enabled, isReady]);

  const value = useMemo<GuestDataContextValue>(() => {
    const save = <T extends { id: string; user_id: string; created_at: string }>(
      key: keyof GuestData,
      record: Omit<T, "id" | "user_id" | "created_at">,
      recordId: string | undefined
    ) => {
      const item = { ...record, id: recordId ?? id(), user_id: GUEST_ID, created_at: now() } as T;
      setData((previous) => {
        const list = previous[key] as unknown as T[];
        return { ...previous, [key]: recordId ? list.map((entry) => entry.id === recordId ? item : entry) : [item, ...list] };
      });
      return item;
    };
    const remove = (key: keyof GuestData, recordId: string) => {
      setData((previous) => ({ ...previous, [key]: (previous[key] as unknown[]).filter((entry) => (entry as { id: string }).id !== recordId) }));
    };
    return {
      ...data,
      isGuest: enabled,
      isReady,
      saveExpense: (v, recordId) => save("expenses", v, recordId) as Expense,
      deleteExpense: (recordId) => remove("expenses", recordId),
      saveIncome: (v, recordId) => save("income", v, recordId) as Income,
      deleteIncome: (recordId) => remove("income", recordId),
      saveCategory: (v, recordId) => save("categories", v, recordId) as Category,
      deleteCategory: (recordId) => remove("categories", recordId),
      saveBudget: (v, recordId) => save("budgets", v, recordId) as Budget,
      deleteBudget: (recordId) => remove("budgets", recordId),
      saveLoan: (v, recordId) => {
        const item = { ...v, id: recordId ?? id(), user_id: GUEST_ID, created_at: recordId ? (data.loans.find((loan) => loan.id === recordId)?.created_at ?? now()) : now(), updated_at: now() } as UserLoan;
        setData((previous) => ({ ...previous, loans: recordId ? previous.loans.map((loan) => loan.id === recordId ? item : loan) : [item, ...previous.loans] }));
        return item;
      },
      deleteLoan: (recordId) => {
        remove("loans", recordId);
        setData((previous) => ({ ...previous, loanPayments: previous.loanPayments.filter((payment) => payment.loan_id !== recordId) }));
      },
      saveLoanPayment: (v) => save("loanPayments", v, undefined) as LoanPayment,
      deleteLoanPayment: (recordId) => remove("loanPayments", recordId),
      saveMoneyGiven: (v, recordId) => save("moneyGiven", v, recordId) as MoneyGiven,
      deleteMoneyGiven: (recordId) => {
        remove("moneyGiven", recordId);
        setData((previous) => ({ ...previous, givenRepayments: previous.givenRepayments.filter((payment) => payment.given_id !== recordId) }));
      },
      saveGivenRepayment: (v) => {
        const item = save("givenRepayments", v, undefined) as GivenRepayment;
        setData((previous) => {
          const parent = previous.moneyGiven.find((entry) => entry.id === v.given_id);
          if (!parent) return previous;
          const total = previous.givenRepayments.filter((repayment) => repayment.given_id === v.given_id).reduce((sum, repayment) => sum + Number(repayment.amount), 0);
          const status = total >= Number(parent.amount) ? "Returned" : "Partially Returned";
          return { ...previous, moneyGiven: previous.moneyGiven.map((entry) => entry.id === v.given_id ? { ...entry, status } : entry) };
        });
        return item;
      },
      saveMoneyTaken: (v, recordId) => save("moneyTaken", v, recordId) as MoneyTaken,
      deleteMoneyTaken: (recordId) => {
        remove("moneyTaken", recordId);
        setData((previous) => ({ ...previous, takenRepayments: previous.takenRepayments.filter((payment) => payment.taken_id !== recordId) }));
      },
      saveTakenRepayment: (v) => {
        const item = save("takenRepayments", v, undefined) as TakenRepayment;
        setData((previous) => {
          const parent = previous.moneyTaken.find((entry) => entry.id === v.taken_id);
          if (!parent) return previous;
          const total = previous.takenRepayments.filter((repayment) => repayment.taken_id === v.taken_id).reduce((sum, repayment) => sum + Number(repayment.amount), 0);
          const status = total >= Number(parent.amount) ? "Repaid" : "Partially Repaid";
          return { ...previous, moneyTaken: previous.moneyTaken.map((entry) => entry.id === v.taken_id ? { ...entry, status } : entry) };
        });
        return item;
      },
      deleteAll: () => setData(emptyData),
    };
  }, [data, isReady]);

  return <GuestDataContext.Provider value={value}>{children}</GuestDataContext.Provider>;
}

export function useGuestData() {
  const value = useContext(GuestDataContext);
  if (!value) throw new Error("useGuestData must be used inside GuestDataProvider");
  return value;
}

export { GUEST_ID, STORAGE_KEY };
