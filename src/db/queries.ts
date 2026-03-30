import dayjs from "dayjs";

import { db, initializeDatabase } from "./database";
import {
  CategoryStat,
  DailyTrendPoint,
  InsightSnapshot,
  MerchantStat,
  Summary,
  Transaction,
  TransactionFilters,
  TransactionInput,
} from "@/types";

initializeDatabase();

const DEFAULT_MONTHLY_BUDGET = 20000;

function buildInClause(values: string[]) {
  return values.map(() => "?").join(", ");
}

export function insertTransaction(tx: TransactionInput) {
  const statement = db.prepareSync(
    `INSERT INTO transactions (amount, merchant, category, app_source, type, date)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  try {
    const result = statement.executeSync([
      tx.amount,
      tx.merchant,
      tx.category,
      tx.app_source,
      tx.type,
      tx.date,
    ]);

    return Number(result.lastInsertRowId);
  } finally {
    statement.finalizeSync();
  }
}

export function bulkInsertTransactions(list: TransactionInput[]) {
  if (!list.length) {
    return 0;
  }

  let inserted = 0;

  db.withTransactionSync(() => {
    const duplicateCheck = db.prepareSync(
      "SELECT id FROM transactions WHERE amount = ? AND date = ? AND merchant = ? LIMIT 1"
    );
    const insertStatement = db.prepareSync(
      `INSERT INTO transactions (amount, merchant, category, app_source, type, date)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    try {
      for (const tx of list) {
        const existing = duplicateCheck.executeSync([tx.amount, tx.date, tx.merchant]).getFirstSync();
        if (existing) {
          continue;
        }

        insertStatement.executeSync([
          tx.amount,
          tx.merchant,
          tx.category,
          tx.app_source,
          tx.type,
          tx.date,
        ]);
        inserted += 1;
      }
    } finally {
      duplicateCheck.finalizeSync();
      insertStatement.finalizeSync();
    }
  });

  return inserted;
}

export function getTransactions(filters: TransactionFilters = {}) {
  const clauses = ["1=1"];
  const params: Array<string | number> = [];

  if (filters.startDate && filters.endDate) {
    clauses.push("date BETWEEN ? AND ?");
    params.push(filters.startDate, filters.endDate);
  } else if (filters.startDate) {
    clauses.push("date >= ?");
    params.push(filters.startDate);
  } else if (filters.endDate) {
    clauses.push("date <= ?");
    params.push(filters.endDate);
  }

  if (filters.category?.length) {
    clauses.push(`category IN (${buildInClause(filters.category)})`);
    params.push(...filters.category);
  }

  if (filters.app_source?.length) {
    clauses.push(`app_source IN (${buildInClause(filters.app_source)})`);
    params.push(...filters.app_source);
  }

  if (filters.minAmount != null && filters.maxAmount != null) {
    clauses.push("amount BETWEEN ? AND ?");
    params.push(filters.minAmount, filters.maxAmount);
  } else if (filters.minAmount != null) {
    clauses.push("amount >= ?");
    params.push(filters.minAmount);
  } else if (filters.maxAmount != null) {
    clauses.push("amount <= ?");
    params.push(filters.maxAmount);
  }

  if (filters.search?.trim()) {
    clauses.push("LOWER(COALESCE(merchant, '')) LIKE ?");
    params.push(`%${filters.search.trim().toLowerCase()}%`);
  }

  return db
    .getAllSync<Transaction>(
      `SELECT * FROM transactions
       WHERE ${clauses.join(" AND ")}
       ORDER BY date DESC`,
      params
    )
    .map((item) => ({
      ...item,
      amount: Number(item.amount),
    }));
}

export function getSummary(): Summary {
  const today = dayjs().startOf("day").toISOString();
  const tomorrow = dayjs().add(1, "day").startOf("day").toISOString();
  const monthStart = dayjs().startOf("month").toISOString();

  const monthRow = db.getFirstSync<{ total: number | null; count: number }>(
    `SELECT SUM(amount) AS total, COUNT(*) AS count
     FROM transactions
     WHERE type='debit' AND date >= ?`,
    [monthStart]
  );

  const todayRow = db.getFirstSync<{ total: number | null }>(
    `SELECT SUM(amount) AS total
     FROM transactions
     WHERE type='debit' AND date >= ? AND date < ?`,
    [today, tomorrow]
  );

  const trend = getDailyTrend(45);
  const noSpendStreak = calculateNoSpendStreak(trend);
  const monthSpent = Number(monthRow?.total ?? 0);

  return {
    monthSpent,
    todaySpent: Number(todayRow?.total ?? 0),
    transactionCount: Number(monthRow?.count ?? 0),
    noSpendStreak,
    budgetProgress: Math.min(monthSpent / DEFAULT_MONTHLY_BUDGET, 1),
  };
}

export function getCategoryStats() {
  return db.getAllSync<CategoryStat>(
    `SELECT category, SUM(amount) AS total
     FROM transactions
     WHERE type='debit'
     GROUP BY category
     ORDER BY total DESC`
  );
}

export function getDailyTrend(limitDays = 30) {
  const start = dayjs().subtract(limitDays, "day").startOf("day").toISOString();
  return db.getAllSync<DailyTrendPoint>(
    `SELECT date(date) AS day, SUM(amount) AS total
     FROM transactions
     WHERE type='debit' AND date >= ?
     GROUP BY day
     ORDER BY day ASC`,
    [start]
  );
}

export function getTopMerchants() {
  return db.getAllSync<MerchantStat>(
    `SELECT merchant, SUM(amount) AS total
     FROM transactions
     WHERE type='debit'
     GROUP BY merchant
     ORDER BY total DESC
     LIMIT 5`
  );
}

export function deleteTransaction(id: number) {
  db.runSync("DELETE FROM transactions WHERE id = ?", [id]);
}

export function updateCategory(id: number, category: string) {
  db.runSync("UPDATE transactions SET category = ? WHERE id = ?", [category, id]);
}

export function resetDatabase() {
  db.runSync("DELETE FROM transactions");
}

export function getDistinctCategories() {
  return db.getAllSync<{ category: string }>(
    "SELECT DISTINCT category FROM transactions WHERE category IS NOT NULL AND category != '' ORDER BY category ASC"
  );
}

export function getDistinctApps() {
  return db.getAllSync<{ app_source: string }>(
    "SELECT DISTINCT app_source FROM transactions WHERE app_source IS NOT NULL AND app_source != '' ORDER BY app_source ASC"
  );
}

export function getInsightSnapshot(): InsightSnapshot {
  const now = dayjs();
  const thisWeekStart = now.startOf("week").toISOString();
  const lastWeekStart = now.subtract(1, "week").startOf("week").toISOString();
  const thisWeekSpend = Number(
    db.getFirstSync<{ total: number | null }>(
      "SELECT SUM(amount) AS total FROM transactions WHERE type='debit' AND date >= ?",
      [thisWeekStart]
    )?.total ?? 0
  );
  const lastWeekSpend = Number(
    db.getFirstSync<{ total: number | null }>(
      "SELECT SUM(amount) AS total FROM transactions WHERE type='debit' AND date >= ? AND date < ?",
      [lastWeekStart, thisWeekStart]
    )?.total ?? 0
  );

  const topCategory = getCategoryStats()[0]?.category ?? "No data";
  const topMerchant = getTopMerchants()[0]?.merchant ?? "No data";
  const highestSpend = Number(
    db.getFirstSync<{ amount: number | null }>(
      "SELECT MAX(amount) AS amount FROM transactions WHERE type='debit'"
    )?.amount ?? 0
  );
  const favoriteMerchants = getTopMerchants()
    .filter((item) => item.merchant)
    .slice(0, 3)
    .map((item) => item.merchant);

  const summary = getSummary();
  const smartAlert =
    summary.budgetProgress >= 0.9
      ? "You are close to your monthly budget. Consider slowing non-essential spending."
      : undefined;

  return {
    weeklyDelta: lastWeekSpend === 0 ? thisWeekSpend : ((thisWeekSpend - lastWeekSpend) / lastWeekSpend) * 100,
    topCategory,
    topMerchant,
    highestSpend,
    favoriteMerchants,
    smartAlert,
  };
}

function calculateNoSpendStreak(trend: DailyTrendPoint[]) {
  const activeDays = new Set(trend.filter((item) => Number(item.total) > 0).map((item) => item.day));
  let streak = 0;

  for (let offset = 0; offset < 60; offset += 1) {
    const day = dayjs().subtract(offset, "day").format("YYYY-MM-DD");
    if (activeDays.has(day)) {
      if (offset === 0) {
        continue;
      }
      break;
    }
    streak += 1;
  }

  return streak;
}
