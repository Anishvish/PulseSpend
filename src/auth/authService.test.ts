jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@/db/database", () => ({
  db: {
    getFirstSync: jest.fn(),
    prepareSync: jest.fn(),
    runSync: jest.fn(),
  },
  initializeDatabase: jest.fn(),
}));

jest.mock("@/auth/passwordCrypto", () => ({
  hashPassword: jest.fn((password: string) => `hashed:${password}`),
  verifyPassword: jest.fn((password: string, hash: string) => hash === `hashed:${password}`),
}));

import * as SecureStore from "expo-secure-store";
import { db as mockDb } from "@/db/database";

import {
  createSessionForUser,
  login,
  resetPassword,
  signup,
  updateProfile,
} from "@/auth/authService";

const mockedDb = mockDb as unknown as {
  getFirstSync: jest.Mock;
  prepareSync: jest.Mock;
  runSync: jest.Mock;
};

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an account successfully", async () => {
    const executeSync = jest.fn(() => ({ lastInsertRowId: 7 }));
    const finalizeSync = jest.fn();
    mockedDb.getFirstSync
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({
        id: 7,
        name: "Anish",
        email: "a@gmail.com",
        created_at: "2026-03-31",
        password_hash: "hashed:secret123",
      });
    mockedDb.prepareSync.mockReturnValue({
      executeSync,
      finalizeSync,
    });

    const result = await signup("Anish", "a@gmail.com", "secret123");

    expect(result.success).toBe(true);
    expect(executeSync).toHaveBeenCalledWith(["Anish", "a@gmail.com", "hashed:secret123"]);
    expect(finalizeSync).toHaveBeenCalled();
  });

  it("rejects duplicate email signup", async () => {
    mockedDb.getFirstSync.mockReturnValueOnce({ id: 1 });

    const result = await signup("Anish", "a@gmail.com", "secret123");

    expect(result).toEqual({
      success: false,
      error: "An account with this email already exists.",
    });
  });

  it("logs in a valid user and saves the session", async () => {
    mockedDb.getFirstSync.mockReturnValue({
      id: 2,
      name: "Anish",
      email: "a@gmail.com",
      created_at: "2026-03-31",
      password_hash: "hashed:secret123",
    });

    const result = await login("a@gmail.com", "secret123");

    expect(result.success).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
  });

  it("rejects login for missing account", async () => {
    mockedDb.getFirstSync.mockReturnValue(null);

    const result = await login("missing@gmail.com", "secret123");

    expect(result).toEqual({
      success: false,
      error: "No account found for that email.",
    });
  });

  it("resets password when metadata matches", async () => {
    mockedDb.getFirstSync.mockReturnValue({
      id: 4,
      name: "Anish",
      email: "a@gmail.com",
      created_at: "2026-03-31",
      password_hash: "hashed:oldpass",
    });

    const result = await resetPassword("Anish", "a@gmail.com", "newpass123");

    expect(result.success).toBe(true);
    expect(mockedDb.runSync).toHaveBeenCalledWith("UPDATE users SET password_hash = ? WHERE id = ?", ["hashed:newpass123", 4]);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it("rejects password reset when metadata does not match", async () => {
    mockedDb.getFirstSync.mockReturnValue({
      id: 4,
      name: "Another User",
      email: "a@gmail.com",
      created_at: "2026-03-31",
      password_hash: "hashed:oldpass",
    });

    const result = await resetPassword("Anish", "a@gmail.com", "newpass123");

    expect(result).toEqual({
      success: false,
      error: "The provided name does not match the account metadata for that email.",
    });
  });

  it("creates a session for an existing user", async () => {
    await createSessionForUser({
      id: 99,
      name: "Anish",
      email: "a@gmail.com",
      created_at: "2026-03-31",
    });

    expect(SecureStore.setItemAsync).toHaveBeenNthCalledWith(
      1,
      "pulsespend-session",
      JSON.stringify({
        id: 99,
        name: "Anish",
        email: "a@gmail.com",
        created_at: "2026-03-31",
      })
    );
    expect(SecureStore.setItemAsync).toHaveBeenNthCalledWith(2, "pulsespend-last-user-id", "99");
  });

  it("updates profile details successfully", async () => {
    mockedDb.getFirstSync
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({
        id: 9,
        name: "Anish Updated",
        email: "updated@gmail.com",
        created_at: "2026-03-31",
        password_hash: "hashed:secret123",
      });

    const result = await updateProfile(9, "Anish Updated", "updated@gmail.com");

    expect(result.success).toBe(true);
    expect(mockedDb.runSync).toHaveBeenCalledWith(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      ["Anish Updated", "updated@gmail.com", 9]
    );
  });

  it("rejects profile update for duplicate email", async () => {
    mockedDb.getFirstSync.mockReturnValueOnce({ id: 2 });

    const result = await updateProfile(9, "Anish Updated", "existing@gmail.com");

    expect(result).toEqual({
      success: false,
      error: "Another account is already using this email.",
    });
  });
});
