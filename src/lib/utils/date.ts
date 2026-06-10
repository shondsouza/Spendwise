import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

export function formatDate(date: string | Date, formatStr: string = "dd MMM yyyy"): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, "dd MMM");
}

export function formatDateWithTime(date: string | Date): string {
  return formatDate(date, "dd MMM yyyy, HH:mm");
}

export function getMonthDateRange(date: Date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getDayOfWeek(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "EEEE");
}

export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === "string" ? parseISO(date1) : date1;
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  return format(d1, "yyyy-MM-dd") === format(d2, "yyyy-MM-dd");
}
