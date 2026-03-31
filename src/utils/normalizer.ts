import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { TransactionInput } from "@/types";

dayjs.extend(customParseFormat);

const DATE_FORMATS = ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", "DD MMM YYYY", "DD MMM YY", "MM/DD/YYYY"];

export function normalizeMerchantName(merchant: string) {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeAmount(amount: number | string) {
  const value = typeof amount === "number" ? amount : Number(String(amount).replace(/,/g, "").trim());
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

export function normalizeDate(value: string | number | Date) {
  if (typeof value === "number" || value instanceof Date) {
    return dayjs(value).toISOString();
  }

  const trimmed = value.trim();
  for (const format of DATE_FORMATS) {
    const parsed = dayjs(trimmed, format, true);
    if (parsed.isValid()) {
      return parsed.toISOString();
    }
  }

  const fallback = dayjs(trimmed);
  return fallback.isValid() ? fallback.toISOString() : dayjs().toISOString();
}

export function normalizeTransactionInput(tx: TransactionInput): TransactionInput {
  return {
    ...tx,
    amount: normalizeAmount(tx.amount),
    merchant: tx.merchant.trim(),
    category: tx.category.trim() || "Others",
    date: normalizeDate(tx.date),
  };
}
