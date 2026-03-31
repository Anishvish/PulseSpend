import { parseBankCsv } from "@/utils/csvParser";
import { isDuplicateTransaction } from "@/utils/deduplicator";
import { normalizeDate, normalizeMerchantName } from "@/utils/normalizer";

describe("import pipeline", () => {
  it("normalizes merchant names consistently", () => {
    expect(normalizeMerchantName("Swiggy! Pvt. Ltd")).toBe("swiggy pvt ltd");
  });

  it("parses a basic bank CSV row", () => {
    const csv = `Date,Description,Debit,Credit
31/03/2026,Swiggy Order,250.00,
`;
    const result = parseBankCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      merchant: "Swiggy Order",
      amount: 250,
      type: "debit",
      source: "bank",
    });
  });

  it("detects duplicates across similar merchants and nearby dates", () => {
    const candidate = {
      amount: 500,
      merchant: "Amazon Pay India",
      category: "Shopping",
      app_source: "Bank",
      source: "bank" as const,
      type: "debit" as const,
      date: normalizeDate("31/03/2026"),
    };

    const existing = {
      amount: 500.4,
      merchant: "amazon pay",
      date: normalizeDate("30/03/2026"),
      type: "debit" as const,
    };

    expect(isDuplicateTransaction(candidate, existing)).toBe(true);
  });
});
