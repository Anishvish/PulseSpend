import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/theme/ThemeProvider";

type Props = PropsWithChildren<{
  scrollable?: boolean;
}>;

export function ScreenContainer({ children, scrollable = true }: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomSpacing = Math.max(insets.bottom + 96, 120);
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, styles.scrollGrow, { paddingBottom: bottomSpacing }]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.scrollContent, styles.fill, { paddingBottom: bottomSpacing }]}>{children}</View>
  );

  return (
    <LinearGradient
      colors={[theme.colors.background, "#0A1628", "#10223B"]}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
        {content}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scrollGrow: {
    flexGrow: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 18,
  },
});
