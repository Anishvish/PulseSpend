import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLogo } from "@/components/AppLogo";
import { AuthInput } from "@/components/AuthInput";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/hooks/useAuth";
import { useDialog } from "@/hooks/useDialog";
import { useAppTheme } from "@/theme/ThemeProvider";
import { AuthStackParamList } from "@/navigation/RootNavigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const theme = useAppTheme();
  const { showDialog } = useDialog();
  const { login, biometricLogin, biometricEnabled, biometricAvailable } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      const result = await login(email, password);
      if (!result.success) {
        showDialog("Login failed", result.error ?? "Unable to sign in.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometric = async () => {
    const result = await biometricLogin();
    if (!result.success) {
      showDialog("Biometric login", result.error ?? "Unable to unlock with biometrics.");
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <AppLogo size={98} />
          <Text style={[styles.brand, { color: theme.colors.accent }]}>PulseSpend</Text>
          <SectionHeader title="Welcome back" subtitle="Securely unlock your offline money dashboard." />
        </View>

        <GlassCard style={styles.card}>
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
            placeholder="Enter your password"
            secureTextEntry
          />
          <GradientButton title="Login" onPress={handleLogin} loading={submitting} />

          {biometricEnabled && biometricAvailable ? (
            <Pressable style={[styles.bioButton, { borderColor: theme.colors.border }]} onPress={handleBiometric}>
              <MaterialCommunityIcons name="fingerprint" size={24} color={theme.colors.accent} />
              <Text style={[styles.bioText, { color: theme.colors.text }]}>Login with Fingerprint</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={[styles.linkText, { color: theme.colors.textMuted }]}>
              Forgot password? <Text style={{ color: theme.colors.accent }}>Reset here</Text>
            </Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate("Signup")}>
            <Text style={[styles.linkText, { color: theme.colors.textMuted }]}>
              No account yet? <Text style={{ color: theme.colors.accent }}>Create one</Text>
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
  bioButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bioText: {
    fontSize: 15,
    fontWeight: "700",
  },
  linkText: {
    textAlign: "center",
    fontSize: 14,
  },
});
