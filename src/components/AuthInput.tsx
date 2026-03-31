import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = TextInputProps & {
  label: string;
};

export function AuthInput({ label, ...props }: Props) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textSoft}
        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
  },
});
