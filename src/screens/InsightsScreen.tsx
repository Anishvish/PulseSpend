import { StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { InsightPill } from "@/components/InsightPill";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatCurrency } from "@/utils/formatters";

export function InsightsScreen() {
  useBootstrap();
  const theme = useAppTheme();
  const { insights, summary } = useTransactionStore((state) => ({
    insights: state.insights,
    summary: state.summary,
  }));

  return (
    <ScreenContainer>
      <SectionHeader title="Insights" subtitle="High-signal reads from your transaction history." />

      <GlassCard style={styles.card}>
        <Text style={[styles.hero, { color: theme.colors.text }]}>
          Weekly spending is {insights.weeklyDelta >= 0 ? "up" : "down"} {Math.abs(insights.weeklyDelta).toFixed(0)}%.
        </Text>
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>
          {insights.smartAlert ?? `You have spent ${formatCurrency(summary.monthSpent)} this month and your top category is ${insights.topCategory}.`}
        </Text>
      </GlassCard>

      <View style={styles.pills}>
        <InsightPill text={`Top category: ${insights.topCategory}`} />
        <InsightPill text={`Highest spend: ${formatCurrency(insights.highestSpend)}`} />
        <InsightPill text={`Favorite merchant: ${insights.topMerchant}`} />
      </View>

      <GlassCard style={styles.card}>
        <SectionHeader title="Favorite merchants" subtitle="Detected from cumulative spend." />
        <View style={styles.merchantList}>
          {insights.favoriteMerchants.length ? (
            insights.favoriteMerchants.map((merchant) => <InsightPill key={merchant} text={merchant} />)
          ) : (
            <Text style={[styles.helper, { color: theme.colors.textMuted }]}>More usage will surface favorite merchants automatically.</Text>
          )}
        </View>
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  hero: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
  },
  helper: {
    fontSize: 15,
    lineHeight: 24,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  merchantList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
