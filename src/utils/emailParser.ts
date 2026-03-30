import dayjs from "dayjs";

import { categorizeMerchant } from "./categorizer";
import { SmsExpenseCandidate } from "@/types";

const AMOUNT_REGEX = /(?:Rs\.?|INR|₹)\s?([\d,]+(?:\.\d{1,2})?)/i;
const MERCHANT_REGEXES = [
  /paid to\s+([A-Za-z0-9 .,&-]+)/i,
  /at\s+([A-Za-z0-9 .,&-]+)\s+on/i,
  /merchant[:\s-]+([A-Za-z0-9 .,&-]+)/i,
  /from\s+([A-Za-z0-9 .,&-]+)\s+(?:for|on)/i,
];
const EXPENSE_HINTS = [/debited/i, /spent/i, /paid/i, /purchase/i, /transaction/i, /upi/i, /card/i];

export type EmailLike = {
  subject?: string;
  body?: string;
  from?: string;
  date?: string | number;
};

export function parseExpenseEmail(email: EmailLike): SmsExpenseCandidate | null {
  const content = `${email.subject ?? ""}\n${email.body ?? ""}`.trim();
  if (!content || !EXPENSE_HINTS.some((hint) => hint.test(content))) {
    return null;
  }

  const amountMatch = content.match(AMOUNT_REGEX);
  if (!amountMatch) {
    return null;
  }

  const merchant = extractMerchant(content);
  const amount = Number(amountMatch[1].replace(/,/g, ""));
  const type = /credited|refund|received/i.test(content) ? "credit" : "debit";

  return {
    amount,
    merchant,
    category: categorizeMerchant(merchant),
    app_source: "Email",
    type,
    date: dayjs(email.date ?? Date.now()).toISOString(),
    rawMessage: content,
  };
}

export function parseEmailBatch(emails: EmailLike[]) {
  return emails
    .map(parseExpenseEmail)
    .filter((item): item is SmsExpenseCandidate => Boolean(item));
}

function extractMerchant(content: string) {
  for (const regex of MERCHANT_REGEXES) {
    const match = content.match(regex);
    if (match?.[1]) {
      return match[1].trim().replace(/\.$/, "");
    }
  }

  return "Unknown Merchant";
}
