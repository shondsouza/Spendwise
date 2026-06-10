import { CURRENCY_SYMBOL } from "@/lib/constants/config";

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d.-]/g, ""));
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
