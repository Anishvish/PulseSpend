import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLogo } from "@/components/AppLogo";
import { AuthInput } from "@/components/AuthInput";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/hooks/useAuth";
import { useDialog } from "@/hooks/useDialog";
import { AuthStackParamList } from "@/navigation/RootNavigation";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { resetPassword } = useAuth();
  const { showDialog } = useDialog();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    if (!name.trim()) {
      showDialog("Missing name", "Enter the account name used during signup.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      showDialog("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (newPassword.length < 6) {
      showDialog("Weak password", "New password should be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showDialog("Password mismatch", "New password and confirm password must match.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await resetPassword(name, email, newPassword);
      if (!result.success) {
        showDialog("Reset failed", result.error ?? "Password could not be reset.");
        return;
      }

      showDialog("Password updated", result.message ?? "Password reset successfully.");
      navigation.navigate("Login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <AppLogo size={92} />
          <Text style={[styles.brand, { color: theme.colors.accent }]}>PulseSpend</Text>
          <SectionHeader title="Forgot password" subtitle="Verify local account metadata and set a new password." />
        </View>

        <GlassCard style={styles.card}>
          <AuthInput label="Account Name" value={name} onChangeText={setName} placeholder="Name used in signup" />
          <AuthInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AuthInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />
          <AuthInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secureTextEntry
          />
          <GradientButton title="Reset Password" onPress={handleReset} loading={submitting} />
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={[styles.linkText, { color: theme.colors.textMuted }]}>
              Back to <Text style={{ color: theme.colors.accent }}>Login</Text>
            </Text>
          </Pressable>
        </GlassCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  hero: {
    alignItems: "center",
    gap: 8,
  },
  brand: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  card: {
    gap: 16,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  linkText: {
    textAlign: "center",
    fontSize: 14,
  },
});
