import { StyleSheet, Text, View } from "react-native";
import { CartesianChart, Line, Pie, PolarChart } from "victory-native";
import { useShallow } from "zustand/react/shallow";

import { GlassCard } from "@/components/GlassCard";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { MetricCard } from "@/components/MetricCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatCurrency } from "@/utils/formatters";

export function DashboardScreen() {
  const theme = useAppTheme();
  const { summary, dailyTrend, categoryStats, insights } = useTransactionStore(
    useShallow((state) => ({
      summary: state.summary,
      dailyTrend: state.dailyTrend,
      categoryStats: state.categoryStats,
      insights: state.insights,
    }))
  );

  const lineData = dailyTrend.map((item) => ({ x: item.day, y: Number(item.total) }));
  const pieData = categoryStats.slice(0, 5).map((item, index) => ({
    label: item.category,
    value: Number(item.total),
    color: [theme.colors.accent, theme.colors.accent2, theme.colors.success, theme.colors.warning, theme.colors.danger][index % 5],
  }));

  return (
    <ScreenContainer>
      <SectionHeader title="PulseSpend" subtitle="Offline-first UPI intelligence for your daily money flow." />

      <View style={styles.metricsRow}>
        <MetricCard label="This month" value={formatCurrency(summary.monthSpent)} helper={`${summary.transactionCount} debits tracked`} />
        <MetricCard
          label="Today"
          value={formatCurrency(summary.todaySpent)}
          helper={`${summary.noSpendStreak} no-spend days streak`}
          accent={["rgba(100,210,166,0.28)", "rgba(100,210,166,0.05)"]}
        />
      </View>

      <GlassCard>
        <SectionHeader title="Daily trend" subtitle="A smooth read on the spending curve across the last month." />
        <View style={styles.chartBox}>
          {lineData.length ? (
            <CartesianChart data={lineData} xKey="x" yKeys={["y"]}>
              {({ points }) => (
                <Line
                  points={points.y}
                  color={theme.colors.accent}
                  strokeWidth={3}
                  animate={{ type: "timing", duration: 450 }}
                />
              )}
            </CartesianChart>
          ) : (
            <Text style={[styles.chartEmpty, { color: theme.colors.textMuted }]}>Import SMS data to unlock your trendline.</Text>
          )}
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Category mix" subtitle={`Top category: ${insights.topCategory}`} />
        <View style={styles.pieBox}>
          {pieData.length ? (
            <PolarChart data={pieData} labelKey="label" valueKey="value" colorKey="color">
              <Pie.Chart innerRadius={54} size={210}>
                {() => <Pie.Slice animate={{ type: "timing", duration: 450 }} />}
              </Pie.Chart>
            </PolarChart>
          ) : (
            <Text style={[styles.chartEmpty, { color: theme.colors.textMuted }]}>No category data yet.</Text>
          )}
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Heatmap" subtitle="Spot dense spending clusters instantly." />
        <HeatmapGrid points={dailyTrend} />
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Smart note" subtitle="Budget and merchant intelligence" />
        <Text style={[styles.insightText, { color: theme.colors.textMuted }]}>
          {insights.smartAlert ??
            `${insights.topMerchant} is currently your strongest merchant signal. Weekly spending is ${insights.weeklyDelta.toFixed(0)}% versus the prior week.`}
        </Text>
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    gap: 14,
  },
  chartBox: {
    height: 220,
    marginTop: 18,
  },
  pieBox: {
    height: 220,
    marginTop: 18,
  },
  chartEmpty: {
    fontSize: 14,
    paddingTop: 80,
  },
  insightText: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 24,
  },
});
