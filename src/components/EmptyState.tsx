import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  title: string;
  subtitle: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

export function EmptyState({ title, subtitle, icon = "database-search-outline" }: Props) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={34} color={theme.colors.textSoft} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
