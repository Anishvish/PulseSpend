import Papa from "papaparse";

import { categorizeMerchant } from "./categorizer";
import { normalizeAmount, normalizeDate } from "./normalizer";
import { TransactionInput } from "@/types";

const DATE_HEADERS = ["date", "txn date", "transaction date", "value date"];
const DESCRIPTION_HEADERS = ["description", "narration", "particulars", "remarks", "details"];
const DEBIT_HEADERS = ["debit", "withdrawal amt.", "withdrawal", "debit amount"];
const CREDIT_HEADERS = ["credit", "deposit amt.", "deposit", "credit amount"];
const AMOUNT_HEADERS = ["amount", "txn amount", "transaction amount"];

function findValue(row: Record<string, string>, headers: string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [key.toLowerCase().trim(), value] as const);
  for (const header of headers) {
    const match = normalizedEntries.find(([key]) => key === header);
    if (match?.[1]) {
      return String(match[1]).trim();
    }
  }
  return "";
}

function parseRow(row: Record<string, string>): TransactionInput | null {
  const rawDate = findValue(row, DATE_HEADERS);
  const merchant = findValue(row, DESCRIPTION_HEADERS) || "Bank statement";
  const debit = findValue(row, DEBIT_HEADERS);
  const credit = findValue(row, CREDIT_HEADERS);
  const amountField = findValue(row, AMOUNT_HEADERS);

  const amount = normalizeAmount(debit || credit || amountField);
  if (!rawDate || !amount) {
    return null;
  }

  const inferredType = debit ? "debit" : credit ? "credit" : amountField.startsWith("-") ? "debit" : "credit";

  return {
    amount: Math.abs(amount),
    merchant,
    category: categorizeMerchant(merchant),
    app_source: "Bank",
    source: "bank",
    type: inferredType,
    date: normalizeDate(rawDate),
  };
}

export function parseBankCsv(csvText: string) {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data
    .map((item: Record<string, string>) => parseRow(item))
    .filter((item): item is TransactionInput => Boolean(item));
}
