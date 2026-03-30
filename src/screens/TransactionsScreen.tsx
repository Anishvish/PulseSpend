import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { FilterChip } from "@/components/FilterChip";
import { GlassCard } from "@/components/GlassCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { TransactionRow } from "@/components/TransactionRow";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Transaction } from "@/types";
import { groupDateLabel } from "@/utils/formatters";

const CATEGORY_OPTIONS = ["Food", "Travel", "Shopping", "Bills", "Entertainment", "Others"];

export function TransactionsScreen() {
  useBootstrap();
  const theme = useAppTheme();
  const { transactions, deleteTransaction, updateCategory } = useTransactionStore((state) => ({
    transactions: state.transactions,
    deleteTransaction: state.deleteTransaction,
    updateCategory: state.updateCategory,
  }));
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [customCategory, setCustomCategory] = useState("");

  const grouped = useMemo(() => {
    const sections: Array<{ title: string; data: Transaction[] }> = [];
    const map = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      const label = groupDateLabel(tx.date);
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label)?.push(tx);
    }

    map.forEach((data, title) => sections.push({ title, data }));
    return sections;
  }, [transactions]);

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.headerWrap}>
        <SectionHeader title="Transactions" subtitle="Swipe left to edit categories or remove noisy entries." />
      </View>

      {!transactions.length ? (
        <EmptyState title="No transactions yet" subtitle="Run SMS sync from Settings to build your ledger." />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSoft }]}>{item.title}</Text>
              <View style={styles.sectionRows}>
                {item.data.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    onDelete={deleteTransaction}
                    onEditCategory={(value) => {
                      setSelectedTx(value);
                      setCustomCategory(value.category);
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        />
      )}

      <Modal transparent visible={Boolean(selectedTx)} animationType="slide" onRequestClose={() => setSelectedTx(null)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <SectionHeader title="Update category" subtitle={selectedTx?.merchant} />
            <View style={styles.chips}>
              {CATEGORY_OPTIONS.map((option) => (
                <FilterChip key={option} label={option} active={customCategory === option} onPress={() => setCustomCategory(option)} />
              ))}
            </View>
            <TextInput
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Custom category"
              placeholderTextColor={theme.colors.textSoft}
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryBtn, { borderColor: theme.colors.border }]} onPress={() => setSelectedTx(null)}>
                <Text style={[styles.secondaryText, { color: theme.colors.textMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: theme.colors.accent }]}
                onPress={() => {
                  if (!selectedTx) {
                    return;
                  }
                  const category = customCategory.trim() || "Others";
                  updateCategory(selectedTx.id, category);
                  setSelectedTx(null);
                  Alert.alert("Updated", "Transaction category was saved.");
                }}
              >
                <Text style={styles.primaryText}>Save</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 16,
    gap: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  sectionRows: {
    gap: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4,10,18,0.6)",
    justifyContent: "flex-end",
    padding: 20,
  },
  modalCard: {
    gap: 16,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#08111E",
  },
});
