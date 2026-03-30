import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = PropsWithChildren<{
  scrollable?: boolean;
}>;

export function ScreenContainer({ children, scrollable = true }: Props) {
  const theme = useAppTheme();
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.scrollContent}>{children}</View>
  );

  return (
    <LinearGradient
      colors={[theme.colors.background, "#0A1628", "#10223B"]}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex}>{content}</SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 18,
  },
});
