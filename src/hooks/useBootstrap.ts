import { useEffect, useRef } from "react";

import { initializeDatabase } from "@/db/database";
import { useTransactionStore } from "@/store/useTransactionStore";

export function useBootstrap(enabled = true) {
  const refreshFromDB = useTransactionStore((state) => state.refreshFromDB);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (!enabled) {
      hasBootstrapped.current = false;
      return;
    }

    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;
    initializeDatabase();
    refreshFromDB();
  }, [enabled, refreshFromDB]);
}
