import { useEffect } from "react";

import { initializeDatabase } from "@/db/database";
import { useTransactionStore } from "@/store/useTransactionStore";

export function useBootstrap() {
  const refreshFromDB = useTransactionStore((state) => state.refreshFromDB);

  useEffect(() => {
    initializeDatabase();
    refreshFromDB();
  }, [refreshFromDB]);
}
