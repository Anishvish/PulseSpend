import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  createSessionForUser,
  getCurrentUser,
  getLastLoggedInUser,
  hasAnyUser,
  isBiometricEnabled,
  login as loginService,
  resetPassword as resetPasswordService,
  logout as logoutService,
  setBiometricEnabled,
  signup as signupService,
  updateProfile as updateProfileService,
} from "@/auth/authService";
import { authenticateBiometric, checkBiometricSupport } from "@/auth/biometric";
import { useDialog } from "@/hooks/useDialog";
import { AuthUser } from "@/types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  hasLocalAccount: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (name: string, email: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfile: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  biometricLogin: () => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { showDialog } = useDialog();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasLocalAccount, setHasLocalAccount] = useState(false);

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionUser, biometricFlag, support, localAccountExists] = await Promise.all([
        getCurrentUser(),
        isBiometricEnabled(),
        checkBiometricSupport(),
        hasAnyUser(),
      ]);

      setUser(sessionUser);
      setBiometricEnabledState(biometricFlag);
      setBiometricAvailable(support.supported);
      setHasLocalAccount(localAccountExists);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginService(email, password);
      if (!result.success || !result.user) {
        return result;
      }

      setUser(result.user);
      setHasLocalAccount(true);

      if (!biometricEnabled) {
        const support = await checkBiometricSupport();
        setBiometricAvailable(support.supported);
        if (support.supported) {
          showDialog("Enable fingerprint login?", "Use biometrics as a quick local unlock the next time you open PulseSpend.", [
            { label: "Not now", variant: "secondary" },
            {
              label: "Enable",
              onPress: async () => {
                await setBiometricEnabled(true);
                setBiometricEnabledState(true);
              },
            },
          ]);
        }
      }

      return { success: true as const };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error && error.message.trim()
          ? error.message
          : "Login could not be completed. Please try again.",
      };
    }
  }, [biometricEnabled, showDialog]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const created = await signupService(name, email, password);
      if (!created.success || !created.user) {
        return created;
      }

      await createSessionForUser(created.user);
      setUser(created.user);
      setHasLocalAccount(true);

      const support = await checkBiometricSupport();
      setBiometricAvailable(support.supported);
      if (support.supported) {
        showDialog("Enable fingerprint login?", "Use biometrics as a fast unlock for future app launches.", [
          { label: "Later", variant: "secondary" },
          {
            label: "Enable",
            onPress: async () => {
              await setBiometricEnabled(true);
              setBiometricEnabledState(true);
            },
          },
        ]);
      }

      return { success: true as const };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error && error.message.trim()
          ? error.message
          : "Account creation failed unexpectedly. Please try again.",
      };
    }
  }, [showDialog]);

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (name: string, email: string, newPassword: string) => {
    try {
      return await resetPasswordService(name, email, newPassword);
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error && error.message.trim()
          ? error.message
          : "Password reset failed unexpectedly. Please try again.",
      };
    }
  }, []);

  const updateProfile = useCallback(async (name: string, email: string) => {
    if (!user) {
      return {
        success: false as const,
        error: "No active user session was found.",
      };
    }

    try {
      const result = await updateProfileService(user.id, name, email);
      if (!result.success || !result.user) {
        return result;
      }

      await createSessionForUser(result.user);
      setUser(result.user);
      return { success: true as const };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error && error.message.trim()
          ? error.message
          : "Profile update failed unexpectedly. Please try again.",
      };
    }
  }, [user]);

  const biometricLogin = useCallback(async () => {
    const [enabled, support] = await Promise.all([isBiometricEnabled(), checkBiometricSupport()]);
    setBiometricEnabledState(enabled);
    setBiometricAvailable(support.supported);

    if (!enabled) {
      return { success: false as const, error: "Biometric login is not enabled yet." };
    }

    if (!support.supported) {
      return { success: false as const, error: "Biometric authentication is not available on this device." };
    }

    const unlocked = await authenticateBiometric();
    if (!unlocked) {
      return { success: false as const, error: "Biometric verification failed." };
    }

    const lastUser = await getLastLoggedInUser();
    if (!lastUser) {
      return { success: false as const, error: "No previous user is available for biometric unlock." };
    }

    setUser(lastUser);
    return { success: true as const };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      biometricEnabled,
      biometricAvailable,
      hasLocalAccount,
      login,
      signup,
      resetPassword,
      updateProfile,
      logout,
      biometricLogin,
    }),
    [user, loading, biometricEnabled, biometricAvailable, hasLocalAccount, login, signup, resetPassword, updateProfile, logout, biometricLogin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
