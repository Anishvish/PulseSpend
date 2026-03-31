import { useCallback } from "react";

import { importTransactions, recordImportEvent } from "@/db/queries";
import { useTransactionStore } from "@/store/useTransactionStore";
import { parseExpenseEmail } from "@/utils/emailParser";

type ParsedEmailInput = {
  subject?: string;
  body?: string;
  date?: string;
};

function splitEmailBlocks(raw: string) {
  return raw
    .split(/\n-{3,}\n|\n={3,}\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function parseBlocks(raw: string) {
  const blocks = splitEmailBlocks(raw);
  const emails: ParsedEmailInput[] = blocks.length
    ? blocks.map((block) => {
        const subjectMatch = block.match(/^subject:\s*(.+)$/im);
        const dateMatch = block.match(/^date:\s*(.+)$/im);
        const body = block
          .replace(/^subject:\s*.+$/im, "")
          .replace(/^date:\s*.+$/im, "")
          .trim();

        return {
          subject: subjectMatch?.[1]?.trim(),
          date: dateMatch?.[1]?.trim(),
          body,
        };
      })
    : [{ body: raw.trim() }];

  return emails
    .map((email) => parseExpenseEmail(email))
    .filter((item): item is NonNullable<ReturnType<typeof parseExpenseEmail>> => Boolean(item));
}

export function useEmailSync() {
  const refreshFromDB = useTransactionStore((state) => state.refreshFromDB);

  return useCallback(async (raw: string) => {
    const parsed = parseBlocks(raw);
    if (!parsed.length) {
      return {
        inserted: 0,
        message: "No expense-style email content was detected. Paste the email body or statement text and try again.",
      };
    }

    const summary = importTransactions(parsed);
    recordImportEvent({
      source: "email",
      file_name: null,
      total_parsed: summary.totalParsed,
      inserted_count: summary.inserted,
      duplicates_skipped: summary.duplicatesSkipped,
      notes: "Parsed from pasted email or statement text.",
    });
    refreshFromDB();

    return {
      inserted: summary.inserted,
      message: summary.inserted
        ? `Imported ${summary.inserted} transactions from email text and skipped ${summary.duplicatesSkipped} duplicates.`
        : "No new transactions were imported. Matching SMS/email duplicates may already exist.",
    };
  }, [refreshFromDB]);
}
