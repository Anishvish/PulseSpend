import { StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { GlassCard } from "./GlassCard";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  label: string;
  value: string;
  accent?: string[];
  helper?: string;
};

export function MetricCard({ label, value, accent, helper }: Props) {
  const theme = useAppTheme();
  const gradient = (accent ?? ["rgba(93,224,230,0.28)", "rgba(143,148,251,0.05)"]) as [string, string];

  return (
    <GlassCard style={styles.container}>
      <LinearGradient colors={gradient} style={styles.glow} />
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      {helper ? <Text style={[styles.helper, { color: theme.colors.textSoft }]}>{helper}</Text> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 128,
    justifyContent: "space-between",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  value: {
    fontSize: 28,
    fontWeight: "800",
  },
  helper: {
    fontSize: 13,
  },
});
