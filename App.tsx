import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/hooks/useAuth";
import { DialogProvider } from "@/hooks/useDialog";
import { RootNavigation } from "@/navigation/RootNavigation";
import { ThemeProvider } from "@/theme/ThemeProvider";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DialogProvider>
            <AuthProvider>
              <StatusBar style="light" />
              <RootNavigation />
            </AuthProvider>
          </DialogProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
