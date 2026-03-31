import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useShallow } from "zustand/react/shallow";

import { AuthInput } from "@/components/AuthInput";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useDialog } from "@/hooks/useDialog";
import { useEmailSync } from "@/hooks/useEmailSync";
import { useSmsSync } from "@/hooks/useSmsSync";
import { useAuth } from "@/hooks/useAuth";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAppTheme, useThemeMode } from "@/theme/ThemeProvider";
import { exportTransactionsToCsv } from "@/utils/exportCsv";

export function SettingsScreen() {
  const theme = useAppTheme();
  const { showDialog } = useDialog();
  const { mode, toggleMode } = useThemeMode();
  const { user, logout, biometricEnabled, updateProfile } = useAuth();
  const syncSms = useSmsSync();
  const syncEmail = useEmailSync();
  const { transactions, resetAllData, refreshFromDB } = useTransactionStore(
    useShallow((state) => ({
      transactions: state.transactions,
      resetAllData: state.resetAllData,
      refreshFromDB: state.refreshFromDB,
    }))
  );
  const [profileVisible, setProfileVisible] = useState(false);
  const [emailVisible, setEmailVisible] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const [emailInput, setEmailInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [importingEmail, setImportingEmail] = useState(false);

  useEffect(() => {
    setProfileName(user?.name ?? "");
    setProfileEmail(user?.email ?? "");
  }, [user]);

  const action = async (handler: () => Promise<string> | string) => {
    try {
      const message = await handler();
      showDialog("PulseSpend", message);
    } catch (error) {
      showDialog("PulseSpend", error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Settings" subtitle="Control sync, exports, and local data safety." />

      <GlassCard style={styles.card}>
        <SettingsAction
          icon="account-circle-outline"
          title={user ? user.name : "Account"}
          subtitle={user?.email ?? "No local account"}
          onPress={() => setProfileVisible(true)}
        />
        <SettingsAction
          icon={biometricEnabled ? "fingerprint" : "fingerprint-off"}
          title="Biometric unlock"
          subtitle={biometricEnabled ? "Enabled for local unlock" : "Disabled for local unlock"}
          onPress={() => undefined}
        />
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
          subtitle="Scan inbox for UPI transaction messages in a dev build/APK."
          onPress={() => action(async () => (await syncSms()).message)}
        />
        <SettingsAction
          icon="email-fast-outline"
          title="Import email statements"
          subtitle="Paste bank email or statement text for offline import."
          onPress={() => setEmailVisible(true)}
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
            showDialog("Reset database", "This deletes every local transaction permanently.", [
              { label: "Cancel", variant: "secondary" },
              {
                label: "Reset",
                variant: "danger",
                onPress: () => {
                  resetAllData();
                  showDialog("PulseSpend", "Local database cleared.");
                },
              },
            ])
          }
        />
        <SettingsAction
          icon="logout"
          title="Logout"
          subtitle="Remove the active secure session from this device."
          onPress={() =>
            showDialog("Logout", "You will need your password or biometrics to get back in.", [
              { label: "Cancel", variant: "secondary" },
              { label: "Logout", variant: "danger", onPress: () => void logout() },
            ])
          }
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>SMS sync note</Text>
        <Text style={[styles.infoBody, { color: theme.colors.textMuted }]}>
          Expo Go cannot read SMS inbox data. Build a development APK/app or a release APK to enable local SMS sync on Android.
        </Text>
      </GlassCard>

      <Modal transparent visible={profileVisible} animationType="slide" onRequestClose={() => setProfileVisible(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <SectionHeader title="Edit profile" subtitle="Update your local account details." />
            <AuthInput label="Name" value={profileName} onChangeText={setProfileName} placeholder="Your name" />
            <AuthInput
              label="Email"
              value={profileEmail}
              onChangeText={setProfileEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={() => setProfileVisible(false)}>
                <Text style={[styles.secondaryText, { color: theme.colors.textMuted }]}>Cancel</Text>
              </Pressable>
              <View style={styles.actionFlex}>
                <GradientButton
                  title="Save"
                  loading={savingProfile}
                  onPress={async () => {
                    try {
                      setSavingProfile(true);
                      const result = await updateProfile(profileName, profileEmail);
                      if (!result.success) {
                        showDialog("Profile update failed", result.error ?? "Unable to update profile.");
                        return;
                      }
                      setProfileVisible(false);
                      showDialog("Profile updated", "Your local account details were updated.");
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </Modal>

      <Modal transparent visible={emailVisible} animationType="slide" onRequestClose={() => setEmailVisible(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <SectionHeader title="Import email statements" subtitle="Paste one or more email bodies. Use --- between emails if needed." />
            <TextInput
              multiline
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder={"Subject: Debit alert\nDate: 2026-03-31\nRs.500 paid to Swiggy via UPI\n---\nSubject: ..."}
              placeholderTextColor={theme.colors.textSoft}
              textAlignVertical="top"
              style={[styles.emailInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryButton, { borderColor: theme.colors.border }]} onPress={() => setEmailVisible(false)}>
                <Text style={[styles.secondaryText, { color: theme.colors.textMuted }]}>Cancel</Text>
              </Pressable>
              <View style={styles.actionFlex}>
                <GradientButton
                  title="Import"
                  loading={importingEmail}
                  onPress={async () => {
                    try {
                      setImportingEmail(true);
                      const result = await syncEmail(emailInput);
                      setEmailVisible(false);
                      setEmailInput("");
                      showDialog("Email import", result.message);
                    } finally {
                      setImportingEmail(false);
                    }
                  }}
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4,10,18,0.66)",
    padding: 20,
  },
  modalCard: {
    gap: 16,
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
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionFlex: {
    flex: 1,
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 180,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
  },
});
