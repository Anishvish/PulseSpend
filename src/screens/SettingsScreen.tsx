import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { GlassCard } from "@/components/GlassCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useSmsSync } from "@/hooks/useSmsSync";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAppTheme, useThemeMode } from "@/theme/ThemeProvider";
import { exportTransactionsToCsv } from "@/utils/exportCsv";

export function SettingsScreen() {
  useBootstrap();
  const theme = useAppTheme();
  const { mode, toggleMode } = useThemeMode();
  const syncSms = useSmsSync();
  const { transactions, resetAllData, refreshFromDB } = useTransactionStore((state) => ({
    transactions: state.transactions,
    resetAllData: state.resetAllData,
    refreshFromDB: state.refreshFromDB,
  }));

  const action = async (handler: () => Promise<string> | string) => {
    try {
      const message = await handler();
      Alert.alert("PulseSpend", message);
    } catch (error) {
      Alert.alert("PulseSpend", error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Settings" subtitle="Control sync, exports, and local data safety." />

      <GlassCard style={styles.card}>
        <SettingsAction
          icon={mode === "dark" ? "weather-sunny" : "moon-waning-crescent"}
          title="Theme mode"
          subtitle={`Currently ${mode}. Tap to switch the UI tone.`}
          onPress={() =>
            action(() => {
              toggleMode();
              return `Theme switched to ${mode === "dark" ? "light" : "dark"} mode.`;
            })
          }
        />
        <SettingsAction
          icon="message-processing-outline"
          title="Re-sync SMS"
          subtitle="Scan inbox for UPI transaction messages."
          onPress={() => action(async () => (await syncSms()).message)}
        />
        <SettingsAction
          icon="file-delimited-outline"
          title="Export CSV"
          subtitle="Share your current filtered ledger as CSV."
          onPress={() =>
            action(async () => {
              const uri = await exportTransactionsToCsv(transactions);
              return `CSV ready at ${uri}`;
            })
          }
        />
        <SettingsAction
          icon="refresh-circle"
          title="Refresh dashboard"
          subtitle="Reload all computed metrics from SQLite."
          onPress={() =>
            action(() => {
              refreshFromDB();
              return "Dashboard refreshed from local database.";
            })
          }
        />
        <SettingsAction
          icon="database-remove-outline"
          title="Reset database"
          subtitle="Clear every imported transaction."
          danger
          onPress={() =>
            Alert.alert("Reset database", "This deletes every local transaction permanently.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Reset",
                style: "destructive",
                onPress: () => {
                  resetAllData();
                  Alert.alert("PulseSpend", "Local database cleared.");
                },
              },
            ])
          }
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>SMS sync note</Text>
        <Text style={[styles.infoBody, { color: theme.colors.textMuted }]}>
          Inbox reading requires Android and a development build because Expo Go does not expose third-party SMS modules.
        </Text>
      </GlassCard>
    </ScreenContainer>
  );
}

type ActionProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
};

function SettingsAction({ icon, title, subtitle, onPress, danger }: ActionProps) {
  const theme = useAppTheme();

  return (
    <Pressable onPress={onPress} style={styles.actionRow}>
      <View style={[styles.actionIcon, { backgroundColor: danger ? "rgba(255,107,129,0.15)" : "rgba(93,224,230,0.12)" }]}>
        <MaterialCommunityIcons name={icon} size={22} color={danger ? theme.colors.danger : theme.colors.accent} />
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  actionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  infoBody: {
    fontSize: 14,
    lineHeight: 22,
  },
});
