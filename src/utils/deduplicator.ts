import dayjs from "dayjs";

import { Transaction, TransactionInput } from "@/types";
import { normalizeAmount, normalizeMerchantName } from "./normalizer";

function merchantSimilarity(a: string, b: string) {
  const left = normalizeMerchantName(a);
  const right = normalizeMerchantName(b);
  if (!left || !right) {
    return 0;
  }
  if (left === right || left.includes(right) || right.includes(left)) {
    return 1;
  }

  const leftTokens = new Set(left.split(" "));
  const rightTokens = new Set(right.split(" "));
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlap / Math.max(leftTokens.size, rightTokens.size, 1);
}

export function getDuplicateSearchWindow(date: string) {
  return {
    start: dayjs(date).subtract(1, "day").startOf("day").toISOString(),
    end: dayjs(date).add(1, "day").endOf("day").toISOString(),
  };
}

export function isDuplicateTransaction(candidate: TransactionInput, existing: Pick<Transaction, "amount" | "merchant" | "date" | "type">) {
  const amountClose = Math.abs(normalizeAmount(candidate.amount) - normalizeAmount(existing.amount)) <= 1;
  const dateClose = Math.abs(dayjs(candidate.date).diff(existing.date, "day", true)) <= 1;
  const merchantClose = merchantSimilarity(candidate.merchant, existing.merchant) >= 0.5;
  return amountClose && dateClose && merchantClose && candidate.type === existing.type;
}

export function shouldMergeTransaction(candidate: TransactionInput, existing: Pick<Transaction, "merchant" | "category" | "source">) {
  const existingMerchant = normalizeMerchantName(existing.merchant);
  const candidateMerchant = normalizeMerchantName(candidate.merchant);
  const merchantIsRicher = candidateMerchant.length > existingMerchant.length;
  const categoryIsRicher = existing.category === "Others" && candidate.category !== "Others";
  const sourceIsRicher = existing.source !== "bank" && candidate.source === "bank";

  return merchantIsRicher || categoryIsRicher || sourceIsRicher;
}
