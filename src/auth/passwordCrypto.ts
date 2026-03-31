import * as Crypto from "expo-crypto";
import { compareSync, genSaltSync, hashSync, setRandomFallback } from "bcryptjs";

let configured = false;

export function ensurePasswordCrypto() {
  if (configured) {
    return;
  }

  setRandomFallback((length) => Array.from(Crypto.getRandomBytes(length)));
  configured = true;
}

export function hashPassword(password: string) {
  ensurePasswordCrypto();
  return hashSync(password, genSaltSync(8));
}

export function verifyPassword(password: string, hash: string) {
  ensurePasswordCrypto();
  return compareSync(password, hash);
}
