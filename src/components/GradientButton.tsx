import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary";
};

export function GradientButton({ title, onPress, loading = false, variant = "primary" }: Props) {
  const theme = useAppTheme();
  const colors =
    variant === "primary"
      ? [theme.colors.accent, theme.colors.accent2]
      : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.04)"];

  return (
    <Pressable onPress={onPress} disabled={loading}>
      <LinearGradient colors={colors as [string, string]} style={styles.button}>
        {loading ? (
          <ActivityIndicator color={variant === "primary" ? "#08111E" : theme.colors.text} />
        ) : (
          <Text style={[styles.text, { color: variant === "primary" ? "#08111E" : theme.colors.text }]}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 15,
    fontWeight: "800",
  },
});
