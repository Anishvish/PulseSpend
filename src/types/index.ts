export type TransactionType = "debit" | "credit";
export type TransactionSource = "sms" | "email" | "bank";
export type ImportSource = TransactionSource;

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type Transaction = {
  id: number;
  amount: number;
  merchant: string;
  category: string;
  app_source: string;
  source: TransactionSource;
  type: TransactionType;
  date: string;
  created_at: string;
};

export type TransactionInput = Omit<Transaction, "id" | "created_at">;

export type TransactionFilters = {
  startDate?: string | null;
  endDate?: string | null;
  category?: string[];
  app_source?: string[];
  minAmount?: number | null;
  maxAmount?: number | null;
  search?: string;
};

export type Summary = {
  monthSpent: number;
  todaySpent: number;
  transactionCount: number;
  noSpendStreak: number;
  budgetProgress: number;
};

export type CategoryStat = {
  category: string;
  total: number;
};

export type DailyTrendPoint = {
  day: string;
  total: number;
};

export type MerchantStat = {
  merchant: string;
  total: number;
};

export type ImportEvent = {
  id: number;
  source: ImportSource;
  file_name: string | null;
  total_parsed: number;
  inserted_count: number;
  duplicates_skipped: number;
  notes: string | null;
  created_at: string;
};

export type ImportEventInput = Omit<ImportEvent, "id" | "created_at">;

export type InsightSnapshot = {
  weeklyDelta: number;
  topCategory: string;
  topMerchant: string;
  highestSpend: number;
  favoriteMerchants: string[];
  smartAlert?: string;
};

export type SmsExpenseCandidate = TransactionInput & {
  reference?: string;
  rawMessage: string;
};
