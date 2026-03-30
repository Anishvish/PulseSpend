import { create } from "zustand";

import {
  deleteTransaction as deleteTxQuery,
  getCategoryStats,
  getDailyTrend,
  getDistinctApps,
  getDistinctCategories,
  getInsightSnapshot,
  getSummary,
  getTopMerchants,
  getTransactions,
  resetDatabase,
  updateCategory as updateCategoryQuery,
} from "@/db/queries";
import {
  CategoryStat,
  DailyTrendPoint,
  InsightSnapshot,
  MerchantStat,
  Summary,
  Transaction,
  TransactionFilters,
} from "@/types";

type StoreState = {
  transactions: Transaction[];
  filters: TransactionFilters;
  summary: Summary;
  categoryStats: CategoryStat[];
  dailyTrend: DailyTrendPoint[];
  topMerchants: MerchantStat[];
  insights: InsightSnapshot;
  availableCategories: string[];
  availableApps: string[];
  loading: boolean;
  loadTransactions: () => void;
  applyFilters: (filters: Partial<TransactionFilters>) => void;
  refreshFromDB: () => void;
  deleteTransaction: (id: number) => void;
  updateCategory: (id: number, category: string) => void;
  resetAllData: () => void;
};

const defaultSummary: Summary = {
  monthSpent: 0,
  todaySpent: 0,
  transactionCount: 0,
  noSpendStreak: 0,
  budgetProgress: 0,
};

const defaultInsights: InsightSnapshot = {
  weeklyDelta: 0,
  topCategory: "No data",
  topMerchant: "No data",
  highestSpend: 0,
  favoriteMerchants: [],
};

export const useTransactionStore = create<StoreState>((set, get) => ({
  transactions: [],
  filters: {},
  summary: defaultSummary,
  categoryStats: [],
  dailyTrend: [],
  topMerchants: [],
  insights: defaultInsights,
  availableCategories: [],
  availableApps: [],
  loading: false,
  loadTransactions: () => {
    set({ loading: true });
    const { filters } = get();
    set({
      transactions: getTransactions(filters),
      loading: false,
    });
  },
  applyFilters: (incoming) => {
    const filters = { ...get().filters, ...incoming };
    set({ filters, transactions: getTransactions(filters) });
  },
  refreshFromDB: () => {
    const { filters } = get();
    set({
      transactions: getTransactions(filters),
      summary: getSummary(),
      categoryStats: getCategoryStats(),
      dailyTrend: getDailyTrend(),
      topMerchants: getTopMerchants(),
      insights: getInsightSnapshot(),
      availableCategories: getDistinctCategories().map((item) => item.category),
      availableApps: getDistinctApps().map((item) => item.app_source),
      loading: false,
    });
  },
  deleteTransaction: (id) => {
    deleteTxQuery(id);
    get().refreshFromDB();
  },
  updateCategory: (id, category) => {
    updateCategoryQuery(id, category);
    get().refreshFromDB();
  },
  resetAllData: () => {
    resetDatabase();
    set({ filters: {} });
    get().refreshFromDB();
  },
}));
