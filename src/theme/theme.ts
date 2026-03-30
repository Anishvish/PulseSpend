import { colors } from "./colors";
import { spacing } from "./spacing";

export const darkTheme = {
  colors,
  spacing,
  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    pill: 999,
  },
  shadow: {
    card: {
      shadowColor: "#04101D",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.26,
      shadowRadius: 26,
      elevation: 10,
    },
  },
};

export const lightTheme = {
  colors: {
    ...colors,
    background: "#F3F8FF",
    backgroundAlt: "#E8F0FC",
    surface: "rgba(255, 255, 255, 0.84)",
    surfaceStrong: "#FFFFFF",
    border: "rgba(14, 29, 48, 0.08)",
    text: "#091626",
    textMuted: "#40526B",
    textSoft: "#667A94",
    overlay: "rgba(255,255,255,0.65)",
  },
  spacing,
  radius: darkTheme.radius,
  shadow: darkTheme.shadow,
};

export type AppTheme = typeof darkTheme;
export type ThemeMode = "dark" | "light";
