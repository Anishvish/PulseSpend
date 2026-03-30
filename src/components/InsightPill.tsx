import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  text: string;
};

export function InsightPill({ text }: Props) {
  const theme = useAppTheme();

  return (
    <View style={[styles.pill, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: theme.colors.border }]}>
      <Text style={[styles.text, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
