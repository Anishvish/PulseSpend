import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { DashboardScreen } from "@/screens/DashboardScreen";
import { FiltersScreen } from "@/screens/FiltersScreen";
import { InsightsScreen } from "@/screens/InsightsScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { TransactionsScreen } from "@/screens/TransactionsScreen";
import { useAppTheme, useThemeMode } from "@/theme/ThemeProvider";

const Tab = createBottomTabNavigator();

export function RootNavigation() {
  const appTheme = useAppTheme();
  const { mode } = useThemeMode();

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
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            height: 78,
            backgroundColor: "rgba(9, 22, 38, 0.92)",
            borderTopWidth: 0,
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: 14,
          },
          tabBarIcon: ({ focused, color }) => {
            const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
              Dashboard: "view-dashboard-outline",
              Transactions: "swap-horizontal-circle-outline",
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
        <Tab.Screen name="Filters" component={FiltersScreen} />
        <Tab.Screen name="Insights" component={InsightsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
