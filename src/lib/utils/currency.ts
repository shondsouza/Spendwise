import { getCurrencyOption, getPreferences, type AppPreferences } from "@/lib/preferences";

export function formatCurrency(amount: number, overrides?: Partial<AppPreferences>): string {
  const prefs = { ...getPreferences(), ...overrides };
  const currency = getCurrencyOption(prefs.currency);

  if (prefs.hideAmounts) {
    const symbol =
      new Intl.NumberFormat(currency.locale, {
        style: "currency",
        currency: currency.code,
        currencyDisplay: "narrowSymbol",
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? "";
    return `${symbol}••••`;
  }

  const digits = prefs.showDecimals && currency.code !== "JPY" ? 2 : 0;
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    notation: prefs.compactNumbers ? "compact" : "standard",
    minimumFractionDigits: prefs.compactNumbers ? 0 : digits,
    maximumFractionDigits: prefs.compactNumbers ? 1 : digits,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d.-]/g, ""));
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
