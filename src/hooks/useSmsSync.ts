import { useCallback } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import { importTransactions, recordImportEvent } from "@/db/queries";
import { useTransactionStore } from "@/store/useTransactionStore";
import { parseSmsBatch } from "@/utils/smsParser";

type SmsNativeModule = {
  list: (
    filter: Record<string, unknown>,
    fail: (error: string) => void,
    success: (count: number, smsList: string) => void
  ) => void;
};

function getSmsModule(): SmsNativeModule | null {
  try {
    const mod = require("react-native-get-sms-android");
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

export function useSmsSync() {
  const refreshFromDB = useTransactionStore((state) => state.refreshFromDB);

  return useCallback(async () => {
    if (Platform.OS !== "android") {
      return { inserted: 0, message: "SMS sync is available on Android only." };
    }

    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      return { inserted: 0, message: "SMS permission was not granted." };
    }

    const smsModule = getSmsModule();
    if (!smsModule) {
      return {
        inserted: 0,
        message: "The SMS native module is unavailable in Expo Go. Use an Android development build for inbox sync.",
      };
    }

    const result = await new Promise<{ inserted: number; message: string }>((resolve) => {
      smsModule.list(
        {
          box: "inbox",
          maxCount: 500,
        },
        (error) => resolve({ inserted: 0, message: error }),
        (_count, smsList) => {
          try {
            const parsed = parseSmsBatch(JSON.parse(smsList));
            const summary = importTransactions(parsed);
            recordImportEvent({
              source: "sms",
              file_name: null,
              total_parsed: summary.totalParsed,
              inserted_count: summary.inserted,
              duplicates_skipped: summary.duplicatesSkipped,
              notes: summary.inserted
                ? "Inbox sync completed."
                : "No new UPI entries were added from inbox sync.",
            });
            refreshFromDB();
            resolve({
              inserted: summary.inserted,
              message: summary.inserted
                ? `Imported ${summary.inserted} SMS transactions and skipped ${summary.duplicatesSkipped} duplicates.`
                : "No new UPI transactions found. Matching duplicates may already exist.",
            });
          } catch {
            resolve({ inserted: 0, message: "Unable to parse SMS data." });
          }
        }
      );
    });

    return result;
  }, [refreshFromDB]);
}
