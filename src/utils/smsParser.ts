import dayjs from "dayjs";

import { categorizeMerchant } from "./categorizer";
import { SmsExpenseCandidate } from "@/types";

const AMOUNT_REGEX = /(?:Rs\.?|INR|₹)\s?([\d,]+(?:\.\d{1,2})?)/i;
const MERCHANT_REGEXES = [
  /paid to\s+([A-Za-z0-9 .,&-]+)/i,
  /debited.*?at\s+([A-Za-z0-9 .,&-]+)/i,
  /to\s+([A-Za-z0-9 .,&-]+)\s+on/i,
];
const REF_REGEX = /(?:UPI Ref(?: No)?|UTR|Ref(?:erence)?(?: No)?)[:\s-]*([A-Za-z0-9]+)/i;
const UPI_HINTS = [/upi/i, /paid to/i, /debited/i, /collect request/i];

type SmsLike = {
  body: string;
  date?: string | number;
  address?: string;
};

export function parseUpiSms(message: SmsLike): SmsExpenseCandidate | null {
  const body = message.body?.trim();
  if (!body || !UPI_HINTS.some((hint) => hint.test(body))) {
    return null;
  }

  const amountMatch = body.match(AMOUNT_REGEX);
  if (!amountMatch) {
    return null;
  }

  const merchant = extractMerchant(body);
  const appSource = detectAppSource(body, message.address);
  const amount = Number(amountMatch[1].replace(/,/g, ""));
  const type = /credited|received/i.test(body) ? "credit" : "debit";
  const date = dayjs(message.date ?? Date.now()).toISOString();
  const category = categorizeMerchant(merchant);
  const reference = body.match(REF_REGEX)?.[1];

  return {
    amount,
    merchant,
    category,
    app_source: appSource,
    type,
    date,
    reference,
    rawMessage: body,
  };
}

export function parseSmsBatch(messages: SmsLike[]) {
  return messages
    .map(parseUpiSms)
    .filter((item): item is SmsExpenseCandidate => Boolean(item));
}

function extractMerchant(body: string) {
  for (const regex of MERCHANT_REGEXES) {
    const match = body.match(regex);
    if (match?.[1]) {
      return match[1].trim().replace(/\.$/, "");
    }
  }

  return "Unknown Merchant";
}

function detectAppSource(body: string, address?: string) {
  const source = `${body} ${address ?? ""}`.toLowerCase();
  if (source.includes("gpay") || source.includes("google pay")) {
    return "GPay";
  }
  if (source.includes("phonepe")) {
    return "PhonePe";
  }
  if (source.includes("paytm")) {
    return "Paytm";
  }
  return "UPI";
}
