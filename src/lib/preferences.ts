import { createClient } from "@/lib/supabase/client";

export const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)", locale: "en-IN" },
  { code: "USD", label: "US Dollar ($)", locale: "en-US" },
  { code: "EUR", label: "Euro (€)", locale: "de-DE" },
  { code: "GBP", label: "British Pound (£)", locale: "en-GB" },
  { code: "AED", label: "UAE Dirham (AED)", locale: "en-AE" },
  { code: "SGD", label: "Singapore Dollar (S$)", locale: "en-SG" },
  { code: "AUD", label: "Australian Dollar (A$)", locale: "en-AU" },
  { code: "CAD", label: "Canadian Dollar (C$)", locale: "en-CA" },
  { code: "JPY", label: "Japanese Yen (¥)", locale: "ja-JP" },
  { code: "NPR", label: "Nepalese Rupee (Rs)", locale: "ne-NP" },
] as const;

export const DATE_FORMATS = [
  { value: "pretty", label: "26 Sep 2026", pattern: "dd MMM yyyy" },
  { value: "dmy", label: "26/09/2026", pattern: "dd/MM/yyyy" },
  { value: "mdy", label: "09/26/2026", pattern: "MM/dd/yyyy" },
  { value: "ymd", label: "2026-09-26", pattern: "yyyy-MM-dd" },
] as const;

export const BUDGET_ALERT_PERCENTS = [50, 60, 70, 80, 90, 100] as const;

const PAYMENT_ALIASES: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank: "Bank Transfer",
};

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export type DateFormatId = (typeof DATE_FORMATS)[number]["value"];

export interface AppPreferences {
  currency: CurrencyCode;
  paymentMethod: string;
  hideAmounts: boolean;
  showDecimals: boolean;
  compactNumbers: boolean;
  dateFormat: DateFormatId;
  budgetAlerts: boolean;
  budgetAlertPercent: number;
  confirmBeforeDelete: boolean;
  haptics: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  currency: "INR",
  paymentMethod: "Cash",
  hideAmounts: false,
  showDecimals: true,
  compactNumbers: false,
  dateFormat: "pretty",
  budgetAlerts: true,
  budgetAlertPercent: 80,
  confirmBeforeDelete: true,
  haptics: true,
  reduceMotion: false,
};

const STORAGE_KEY = "spendwise_preferences";

let current: AppPreferences = DEFAULT_PREFERENCES;
const listeners = new Set<() => void>();

export function getPreferences(): AppPreferences {
  return current;
}

export function getCurrencyOption(code: string = current.currency) {
  return CURRENCIES.find((item) => item.code === code) ?? CURRENCIES[0];
}

export function getDatePattern(formatId: DateFormatId = current.dateFormat): string {
  return DATE_FORMATS.find((item) => item.value === formatId)?.pattern ?? DATE_FORMATS[0].pattern;
}

export function subscribePreferences(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function normalizePaymentMethod(value: string | undefined): string {
  if (!value) return DEFAULT_PREFERENCES.paymentMethod;
  return PAYMENT_ALIASES[value.toLowerCase()] ?? value;
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((item) => item.code === value);
}

function isDateFormat(value: unknown): value is DateFormatId {
  return DATE_FORMATS.some((item) => item.value === value);
}

export function sanitizePreferences(input: Partial<AppPreferences> | null | undefined): AppPreferences {
  const source = input ?? {};
  const percent = Number(source.budgetAlertPercent);
  return {
    currency: isCurrencyCode(source.currency) ? source.currency : DEFAULT_PREFERENCES.currency,
    paymentMethod: normalizePaymentMethod(
      typeof source.paymentMethod === "string" ? source.paymentMethod : undefined
    ),
    hideAmounts: source.hideAmounts === true,
    showDecimals: source.showDecimals !== false,
    compactNumbers: source.compactNumbers === true,
    dateFormat: isDateFormat(source.dateFormat) ? source.dateFormat : DEFAULT_PREFERENCES.dateFormat,
    budgetAlerts: source.budgetAlerts !== false,
    budgetAlertPercent: BUDGET_ALERT_PERCENTS.includes(percent as (typeof BUDGET_ALERT_PERCENTS)[number])
      ? percent
      : DEFAULT_PREFERENCES.budgetAlertPercent,
    confirmBeforeDelete: source.confirmBeforeDelete !== false,
    haptics: source.haptics !== false,
    reduceMotion: source.reduceMotion === true,
  };
}

export function applyMotionPreference(reduceMotion = current.reduceMotion) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.reduceMotion = reduceMotion ? "true" : "false";
}

function persistLocal(next: AppPreferences) {
  current = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  applyMotionPreference(next.reduceMotion);
  emit();
}

export function loadPreferences(): AppPreferences {
  if (typeof window === "undefined") return current;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      applyMotionPreference();
      return current;
    }
    persistLocal(sanitizePreferences(JSON.parse(raw)));
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return current;
}

export function updatePreferences(partial: Partial<AppPreferences>): AppPreferences {
  persistLocal(sanitizePreferences({ ...current, ...partial }));
  return current;
}

export async function savePreferences(partial: Partial<AppPreferences>): Promise<void> {
  const next = updatePreferences(partial);
  if (typeof window === "undefined") return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return;
  const { error } = await supabase.auth.updateUser({ data: next });
  if (error) throw error;
}

export function preferencesFromMetadata(
  metadata: Record<string, unknown> | undefined
): Partial<AppPreferences> {
  if (!metadata) return {};
  return sanitizePreferences({
    ...current,
    ...(metadata as Partial<AppPreferences>),
  });
}

export function confirmIfNeeded(message: string): boolean {
  if (!current.confirmBeforeDelete) return true;
  return window.confirm(message);
}
