import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBootstrap } from "@/hooks/useBootstrap";
import { useAuth } from "@/hooks/useAuth";
import { ForgotPasswordScreen } from "@/screens/ForgotPasswordScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { SignupScreen } from "@/screens/SignupScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { FiltersScreen } from "@/screens/FiltersScreen";
import { ImportScreen } from "@/screens/ImportScreen";
import { InsightsScreen } from "@/screens/InsightsScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { TransactionsScreen } from "@/screens/TransactionsScreen";
import { useAppTheme, useThemeMode } from "@/theme/ThemeProvider";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<AuthStackParamList>();

export function RootNavigation() {
  const appTheme = useAppTheme();
  const { mode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const { loading, isAuthenticated } = useAuth();
  useBootstrap(isAuthenticated);

  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        dark: mode === "dark",
        colors: {
          ...DarkTheme.colors,
          background: appTheme.colors.background,
          card: "#091626",
          primary: appTheme.colors.accent,
          border: "transparent",
          text: appTheme.colors.text,
        },
      }}
    >
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={appTheme.colors.accent} size="large" />
          <Text style={[styles.loadingText, { color: appTheme.colors.textMuted }]}>Securing your local vault...</Text>
        </View>
      ) : isAuthenticated ? (
        <Tab.Navigator
          detachInactiveScreens
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: false,
            lazy: true,
            freezeOnBlur: true,
            tabBarStyle: {
              position: "absolute",
              height: 64 + Math.max(insets.bottom, 12),
              backgroundColor: "rgba(9, 22, 38, 0.92)",
              borderTopWidth: 0,
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 12),
            },
            tabBarIcon: ({ focused, color }) => {
              const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
                Dashboard: "view-dashboard-outline",
                Transactions: "swap-horizontal-circle-outline",
                Imports: "file-import-outline",
                Filters: "tune-variant",
                Insights: "chart-timeline-variant",
                Settings: "cog-outline",
              };

              return (
                <MaterialCommunityIcons
                  name={icons[route.name]}
                  size={focused ? 27 : 24}
                  color={focused ? appTheme.colors.accent : color}
                />
              );
            },
            tabBarActiveTintColor: appTheme.colors.accent,
            tabBarInactiveTintColor: appTheme.colors.textSoft,
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Transactions" component={TransactionsScreen} />
          <Tab.Screen name="Imports" component={ImportScreen} />
          <Tab.Screen name="Filters" component={FiltersScreen} />
          <Tab.Screen name="Insights" component={InsightsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
