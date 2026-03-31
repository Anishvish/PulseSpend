import * as SecureStore from "expo-secure-store";

import { hashPassword, verifyPassword } from "./passwordCrypto";
import { db, initializeDatabase } from "@/db/database";
import { AuthUser } from "@/types";

const SESSION_KEY = "pulsespend-session";
const BIOMETRIC_ENABLED_KEY = "pulsespend-biometric-enabled";
const LAST_USER_ID_KEY = "pulsespend-last-user-id";

type UserRow = AuthUser & {
  password_hash: string;
};

initializeDatabase();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUser(row: UserRow | null | undefined): AuthUser | null {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    created_at: row.created_at,
  };
}

export async function signup(name: string, email: string, password: string) {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  if (!trimmedName) {
    return {
      success: false as const,
      error: "Name is required.",
    };
  }
  if (!normalizedEmail) {
    return {
      success: false as const,
      error: "Email is required.",
    };
  }
  if (!password) {
    return {
      success: false as const,
      error: "Password is required.",
    };
  }
  if (password.length < 6) {
    return {
      success: false as const,
      error: "Password should be at least 6 characters.",
    };
  }

  const existing = db.getFirstSync<{ id: number }>("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
  if (existing) {
    return {
      success: false as const,
      error: "An account with this email already exists.",
    };
  }

  const statement = db.prepareSync(
    `INSERT INTO users (name, email, password_hash)
     VALUES (?, ?, ?)`
  );

  try {
    const passwordHash = hashPassword(password);
    const result = statement.executeSync([trimmedName, normalizedEmail, passwordHash]);
    const user = db.getFirstSync<UserRow>(
      "SELECT id, name, email, created_at, password_hash FROM users WHERE id = ?",
      [Number(result.lastInsertRowId)]
    );

    return {
      success: true as const,
      user: mapUser(user),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("unique")) {
      return {
        success: false as const,
        error: "An account with this email already exists.",
      };
    }
    if (message.includes("not null")) {
      return {
        success: false as const,
        error: "Please fill in all required fields before creating the account.",
      };
    }
    if (message.includes("invalid string / salt")) {
      return {
        success: false as const,
        error: "Password security could not be initialized on this device. Please restart the app and try again.",
      };
    }
    if (error instanceof Error && error.message.trim()) {
      return {
        success: false as const,
        error: `Account could not be created: ${error.message}`,
      };
    }

    return {
      success: false as const,
      error: "Unable to create your account right now.",
    };
  } finally {
    statement.finalizeSync();
  }
}

export async function login(email: string, password: string) {
  const user = db.getFirstSync<UserRow>(
    "SELECT id, name, email, created_at, password_hash FROM users WHERE email = ? LIMIT 1",
    [normalizeEmail(email)]
  );

  if (!user) {
    return {
      success: false as const,
      error: "No account found for that email.",
    };
  }

  let validPassword = false;
  try {
    validPassword = verifyPassword(password, user.password_hash);
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("invalid string / salt")) {
      return {
        success: false as const,
        error: "Stored password data is invalid for this account. Please create the account again.",
      };
    }

    return {
      success: false as const,
      error: error instanceof Error && error.message.trim()
        ? `Login check failed: ${error.message}`
        : "Login could not be completed.",
    };
  }
  if (!validPassword) {
    return {
      success: false as const,
      error: "Incorrect password. Please try again.",
    };
  }

  const safeUser = mapUser(user);
  await persistSession(safeUser);
  await SecureStore.setItemAsync(LAST_USER_ID_KEY, String(user.id));

  return {
    success: true as const,
    user: safeUser,
  };
}

export async function logout() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function getCurrentUser() {
  const session = await SecureStore.getItemAsync(SESSION_KEY);
  if (!session) {
    return null;
  }

  try {
    return JSON.parse(session) as AuthUser;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
}

export async function persistSession(user: AuthUser | null) {
  if (!user) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
}

export async function setBiometricEnabled(enabled: boolean) {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
    return;
  }

  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

export async function isBiometricEnabled() {
  return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === "true";
}

export async function getLastLoggedInUser() {
  const rawId = await SecureStore.getItemAsync(LAST_USER_ID_KEY);
  if (!rawId) {
    return null;
  }

  const user = db.getFirstSync<UserRow>(
    "SELECT id, name, email, created_at, password_hash FROM users WHERE id = ? LIMIT 1",
    [Number(rawId)]
  );

  return mapUser(user);
}

export async function hasAnyUser() {
  const row = db.getFirstSync<{ count: number }>("SELECT COUNT(*) AS count FROM users");
  return Number(row?.count ?? 0) > 0;
}

export async function createSessionForUser(user: AuthUser) {
  try {
    await persistSession(user);
    await SecureStore.setItemAsync(LAST_USER_ID_KEY, String(user.id));
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      throw new Error(`Session could not be saved: ${error.message}`);
    }
    throw new Error("Session could not be saved on this device.");
  }
}

export async function updateProfile(userId: number, name: string, email: string) {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName) {
    return {
      success: false as const,
      error: "Name is required.",
    };
  }
  if (!normalizedEmail) {
    return {
      success: false as const,
      error: "Email is required.",
    };
  }

  const duplicate = db.getFirstSync<{ id: number }>(
    "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
    [normalizedEmail, userId]
  );
  if (duplicate) {
    return {
      success: false as const,
      error: "Another account is already using this email.",
    };
  }

  try {
    db.runSync("UPDATE users SET name = ?, email = ? WHERE id = ?", [trimmedName, normalizedEmail, userId]);
    const user = db.getFirstSync<UserRow>(
      "SELECT id, name, email, created_at, password_hash FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    return {
      success: true as const,
      user: mapUser(user),
    };
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      return {
        success: false as const,
        error: `Profile could not be updated: ${error.message}`,
      };
    }

    return {
      success: false as const,
      error: "Profile could not be updated.",
    };
  }
}

export async function resetPassword(name: string, email: string, newPassword: string) {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  if (!trimmedName || !normalizedEmail || !newPassword) {
    return {
      success: false as const,
      error: "Name, email, and new password are required.",
    };
  }
  if (newPassword.length < 6) {
    return {
      success: false as const,
      error: "New password should be at least 6 characters.",
    };
  }

  const user = db.getFirstSync<UserRow>(
    "SELECT id, name, email, created_at, password_hash FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail]
  );
  if (!user) {
    return {
      success: false as const,
      error: "No account was found for that email.",
    };
  }
  if (user.name.trim().toLowerCase() !== trimmedName.toLowerCase()) {
    return {
      success: false as const,
      error: "The provided name does not match the account metadata for that email.",
    };
  }

  try {
    const passwordHash = hashPassword(newPassword);
    db.runSync("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, user.id]);
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return {
      success: true as const,
      message: "Password reset successfully. You can now login with the new password.",
    };
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      return {
        success: false as const,
        error: `Password reset failed: ${error.message}`,
      };
    }

    return {
      success: false as const,
      error: "Password reset failed unexpectedly.",
    };
  }
}
