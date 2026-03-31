import { categorizeMerchant } from "./categorizer";
import { normalizeAmount, normalizeDate } from "./normalizer";
import { TransactionInput } from "@/types";

const LINE_REGEX = /(\d{2}[\/-]\d{2}[\/-]\d{2,4})\s+(.+?)\s+(-?[\d,]+(?:\.\d{2})?)$/;

function base64ToUint8Array(base64: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const cleaned = base64.replace(/=+$/, "");
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i += 4) {
    const encoded1 = chars.indexOf(cleaned[i]);
    const encoded2 = chars.indexOf(cleaned[i + 1]);
    const encoded3 = chars.indexOf(cleaned[i + 2]);
    const encoded4 = chars.indexOf(cleaned[i + 3]);

    const byte1 = (encoded1 << 2) | (encoded2 >> 4);
    const byte2 = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    const byte3 = ((encoded3 & 3) << 6) | encoded4;

    bytes.push(byte1);
    if (!Number.isNaN(byte2) && encoded3 !== -1) {
      bytes.push(byte2);
    }
    if (!Number.isNaN(byte3) && encoded4 !== -1) {
      bytes.push(byte3);
    }
  }

  return new Uint8Array(bytes);
}

function parseLine(line: string): TransactionInput | null {
  const match = line.match(LINE_REGEX);
  if (!match) {
    return null;
  }

  const [, date, merchant, amountString] = match;
  const amount = normalizeAmount(amountString);
  if (!amount) {
    return null;
  }

  return {
    amount: Math.abs(amount),
    merchant: merchant.trim(),
    category: categorizeMerchant(merchant),
    app_source: "Bank",
    source: "bank",
    type: amountString.trim().startsWith("-") ? "debit" : "credit",
    date: normalizeDate(date),
  };
}

export async function parseBankPdf(base64: string) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await pdfjsLib.getDocument({ data: base64ToUint8Array(base64) }).promise;
  const transactions: TransactionInput[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item: { str?: string }) => item.str ?? "").join(" ");
    const lines = text
      .split(/\s{3,}|\n/)
      .map((line: string) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const parsed = parseLine(line);
      if (parsed) {
        transactions.push(parsed);
      }
    }
  }

  return transactions;
}
