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

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { showDialog } = useDialog();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!name.trim()) {
      showDialog("Invalid name", "Please enter your name.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      showDialog("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      showDialog("Weak password", "Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      showDialog("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await signup(name, email, password);
      if (!result.success) {
        showDialog("Signup failed", result.error ?? "Unable to create account.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <AppLogo size={98} />
          <Text style={[styles.brand, { color: theme.colors.accent }]}>PulseSpend</Text>
          <SectionHeader title="Create account" subtitle="Set up secure local access for your expense vault." />
        </View>

        <GlassCard style={styles.card}>
          <AuthInput label="Name" value={name} onChangeText={setName} placeholder="Your full name" />
          <AuthInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AuthInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />
          <AuthInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            secureTextEntry
          />
          <GradientButton title="Create Account" onPress={handleSignup} loading={submitting} />

          <Pressable onPress={() => navigation.goBack()}>
            <Text style={[styles.linkText, { color: theme.colors.textMuted }]}>
              Already have an account? <Text style={{ color: theme.colors.accent }}>Login</Text>
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
