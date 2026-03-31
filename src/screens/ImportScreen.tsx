import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import dayjs from "dayjs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useShallow } from "zustand/react/shallow";

import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { importTransactions, recordImportEvent } from "@/db/queries";
import { useDialog } from "@/hooks/useDialog";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAppTheme } from "@/theme/ThemeProvider";
import { ImportEvent, ImportSource, TransactionInput } from "@/types";
import { parseBankCsv } from "@/utils/csvParser";
import { parseBankPdf } from "@/utils/pdfParser";

type PreviewState = {
  fileName: string;
  transactions: TransactionInput[];
};

const SOURCE_LABELS: Record<ImportSource, string> = {
  bank: "Bank",
  email: "Email",
  sms: "SMS",
};

const SOURCE_ICONS: Record<ImportSource, keyof typeof MaterialCommunityIcons.glyphMap> = {
  bank: "bank-outline",
  email: "email-fast-outline",
  sms: "message-processing-outline",
};

export function ImportScreen() {
  const theme = useAppTheme();
  const { showDialog } = useDialog();
  const { refreshFromDB, importHistory } = useTransactionStore(
    useShallow((state) => ({
      refreshFromDB: state.refreshFromDB,
      importHistory: state.importHistory,
    }))
  );
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    if (!preview?.transactions.length) {
      return null;
    }

    const dates = preview.transactions.map((item) => dayjs(item.date));
    const sorted = dates.sort((a, b) => a.valueOf() - b.valueOf());
    return {
      total: preview.transactions.length,
      start: sorted[0]?.format("DD MMM YYYY"),
      end: sorted[sorted.length - 1]?.format("DD MMM YYYY"),
    };
  }, [preview]);

  const historySummary = useMemo(() => {
    const window = importHistory.slice(0, 8);
    return {
      totalParsed: window.reduce((sum, item) => sum + item.total_parsed, 0),
      totalInserted: window.reduce((sum, item) => sum + item.inserted_count, 0),
      totalDuplicates: window.reduce((sum, item) => sum + item.duplicates_skipped, 0),
    };
  }, [importHistory]);

  const selectFile = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "application/pdf", "text/comma-separated-values"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets.length) {
        return;
      }

      const asset = result.assets[0];
      const extension = asset.name.toLowerCase().split(".").pop();
      let transactions: TransactionInput[] = [];

      if (extension === "csv") {
        const content = await FileSystem.readAsStringAsync(asset.uri);
        transactions = parseBankCsv(content);
      } else if (extension === "pdf") {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        transactions = await parseBankPdf(base64);
      } else {
        showDialog("Unsupported file", "Please choose a CSV or PDF bank statement.");
        return;
      }

      if (!transactions.length) {
        showDialog("Nothing found", "We could not detect any transactions in that file.");
        return;
      }

      setPreview({
        fileName: asset.name,
        transactions,
      });
    } catch (error) {
      showDialog("Import error", error instanceof Error ? error.message : "Unable to read the selected file.");
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!preview) {
      return;
    }

    try {
      setLoading(true);
      const result = importTransactions(preview.transactions);
      recordImportEvent({
        source: "bank",
        file_name: preview.fileName,
        total_parsed: result.totalParsed,
        inserted_count: result.inserted,
        duplicates_skipped: result.duplicatesSkipped,
        notes: `Imported from ${preview.fileName}.`,
      });
      refreshFromDB();
      showDialog(
        "Import complete",
        `Parsed ${result.totalParsed} transactions.\nAdded ${result.inserted} new entries.\nSkipped ${result.duplicatesSkipped} duplicates.`
      );
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Imports" subtitle="Bring in bank statements and review recent import runs across SMS, email, and bank data." />

      <GlassCard style={styles.card}>
        <GradientButton title="Import Bank Statement" onPress={selectFile} loading={loading} />
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>
          Supports CSV and text-based PDF statements. Duplicate transactions across SMS, email, and bank imports are skipped automatically.
        </Text>
      </GlassCard>

      {preview ? (
        <GlassCard style={styles.card}>
          <SectionHeader title="Preview" subtitle={preview.fileName} />
          <View style={styles.metricRow}>
            <PreviewMetric label="Found" value={String(summary?.total ?? 0)} />
            <PreviewMetric label="From" value={summary?.start ?? "-"} />
            <PreviewMetric label="To" value={summary?.end ?? "-"} />
          </View>
          <View style={styles.previewList}>
            {preview.transactions.slice(0, 5).map((transaction, index) => (
              <View key={`${transaction.merchant}-${index}`} style={[styles.previewItem, { borderColor: theme.colors.border }]}>
                <Text style={[styles.previewMerchant, { color: theme.colors.text }]} numberOfLines={1}>
                  {transaction.merchant}
                </Text>
                <Text style={[styles.previewMeta, { color: theme.colors.textMuted }]}>
                  {dayjs(transaction.date).format("DD MMM YYYY")} | {transaction.type} | {transaction.amount}
                </Text>
              </View>
            ))}
          </View>
          <GradientButton title="Confirm Import" onPress={confirmImport} loading={loading} />
        </GlassCard>
      ) : (
        <GlassCard style={styles.emptyCard}>
          <ActivityIndicator color={theme.colors.accent} animating={false} />
          <Text style={[styles.helper, { color: theme.colors.textMuted }]}>
            Pick a statement file to preview total transactions and date range before importing.
          </Text>
        </GlassCard>
      )}

      <GlassCard style={styles.card}>
        <SectionHeader title="Recent Import Summary" subtitle="A quick view of the latest import activity across all local sources." />
        <View style={styles.metricRow}>
          <PreviewMetric label="Parsed" value={String(historySummary.totalParsed)} />
          <PreviewMetric label="Added" value={String(historySummary.totalInserted)} />
          <PreviewMetric label="Duplicates" value={String(historySummary.totalDuplicates)} />
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <SectionHeader title="Import History" subtitle="Recent import runs with source badges, timestamps, and duplicate summaries." />
        {importHistory.length ? (
          <View style={styles.historyList}>
            {importHistory.map((item) => (
              <ImportHistoryCard key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <Text style={[styles.helper, { color: theme.colors.textMuted }]}>
            No import history yet. Run SMS sync, paste email text, or import a bank statement to start logging import runs.
          </Text>
        )}
      </GlassCard>
    </ScreenContainer>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.metricBlock}>
      <Text style={[styles.metricLabel, { color: theme.colors.textSoft }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function ImportHistoryCard({ item }: { item: ImportEvent }) {
  const theme = useAppTheme();
  const isAllDuplicate = item.total_parsed > 0 && item.inserted_count === 0;

  return (
    <View style={[styles.historyCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.overlay }]}>
      <View style={styles.historyHeader}>
        <View style={[styles.sourceBadge, { backgroundColor: "rgba(93,224,230,0.12)", borderColor: theme.colors.border }]}>
          <MaterialCommunityIcons name={SOURCE_ICONS[item.source]} size={16} color={theme.colors.accent} />
          <Text style={[styles.sourceBadgeText, { color: theme.colors.text }]}>{SOURCE_LABELS[item.source]}</Text>
        </View>
        <Text style={[styles.historyTime, { color: theme.colors.textSoft }]}>{dayjs(item.created_at).format("DD MMM, hh:mm A")}</Text>
      </View>

      <Text style={[styles.historyTitle, { color: theme.colors.text }]} numberOfLines={1}>
        {item.file_name || item.notes || "Local import"}
      </Text>

      <View style={styles.summaryRow}>
        <SummaryPill label="Parsed" value={item.total_parsed} />
        <SummaryPill label="Added" value={item.inserted_count} />
        <SummaryPill label="Duplicates" value={item.duplicates_skipped} danger={item.duplicates_skipped > 0} />
      </View>

      <Text style={[styles.historyNote, { color: isAllDuplicate ? theme.colors.warning : theme.colors.textMuted }]}>
        {isAllDuplicate
          ? "Everything matched existing data, so this run only confirmed duplicates."
          : item.notes || "Import completed successfully."}
      </Text>
    </View>
  );
}

function SummaryPill({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.summaryPill,
        {
          backgroundColor: danger ? "rgba(255,191,71,0.16)" : "rgba(93,224,230,0.12)",
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.summaryPillLabel, { color: theme.colors.textSoft }]}>{label}</Text>
      <Text style={[styles.summaryPillValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  helper: {
    fontSize: 14,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: "row",
    gap: 14,
  },
  metricBlock: {
    flex: 1,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  previewList: {
    gap: 10,
  },
  previewItem: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewMerchant: {
    fontSize: 15,
    fontWeight: "700",
  },
  previewMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyCard: {
    alignItems: "center",
    gap: 14,
    minHeight: 180,
    justifyContent: "center",
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sourceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  historyTime: {
    fontSize: 12,
    fontWeight: "600",
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  summaryPillLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryPillValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  historyNote: {
    fontSize: 13,
    lineHeight: 20,
  },
});
