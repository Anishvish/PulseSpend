import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { Transaction } from "@/types";

export async function exportTransactionsToCsv(transactions: Transaction[]) {
  const header = "id,amount,merchant,category,app_source,type,date,created_at";
  const rows = transactions.map((tx) =>
    [
      tx.id,
      tx.amount,
      sanitize(tx.merchant),
      sanitize(tx.category),
      sanitize(tx.app_source),
      tx.type,
      tx.date,
      tx.created_at,
    ].join(",")
  );

  const content = [header, ...rows].join("\n");
  const fileUri = `${FileSystem.cacheDirectory}pulsespend-transactions.csv`;

  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri);
  }

  return fileUri;
}

function sanitize(value: string) {
  const escaped = (value ?? "").replace(/"/g, '""');
  return `"${escaped}"`;
}
