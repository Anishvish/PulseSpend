import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

import { GlassCard } from "./GlassCard";
import { useDialog } from "@/hooks/useDialog";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Transaction } from "@/types";
import { formatCurrency } from "@/utils/formatters";

type Props = {
  transaction: Transaction;
  onDelete: (id: number) => void;
  onEditCategory: (tx: Transaction) => void;
};

export function TransactionRow({ transaction, onDelete, onEditCategory }: Props) {
  const theme = useAppTheme();
  const { showDialog } = useDialog();

  const renderRightActions = () => (
    <View style={styles.actions}>
      <Pressable style={[styles.actionButton, { backgroundColor: theme.colors.warning }]} onPress={() => onEditCategory(transaction)}>
        <MaterialCommunityIcons name="pencil-outline" size={22} color="#08111E" />
      </Pressable>
      <Pressable
        style={[styles.actionButton, { backgroundColor: theme.colors.danger }]}
        onPress={() =>
          showDialog("Delete transaction", "This transaction will be removed permanently.", [
            { label: "Cancel", variant: "secondary" },
            { label: "Delete", variant: "danger", onPress: () => onDelete(transaction.id) },
          ])
        }
      >
        <MaterialCommunityIcons name="delete-outline" size={22} color={theme.colors.white} />
      </Pressable>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.left}>
            <Text style={[styles.merchant, { color: theme.colors.text }]} numberOfLines={1}>
              {transaction.merchant || "Unknown Merchant"}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {transaction.category} • {transaction.app_source}
            </Text>
          </View>
          <Text
            style={[
              styles.amount,
              { color: transaction.type === "debit" ? theme.colors.white : theme.colors.success },
            ]}
          >
            {transaction.type === "debit" ? "-" : "+"}
            {formatCurrency(transaction.amount)}
          </Text>
        </View>
      </GlassCard>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  merchant: {
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
  },
  amount: {
    fontSize: 16,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 12,
  },
  actionButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
