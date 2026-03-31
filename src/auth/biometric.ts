import * as LocalAuthentication from "expo-local-authentication";

export async function checkBiometricSupport() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  return {
    supported: hasHardware && isEnrolled,
    hasHardware,
    isEnrolled,
  };
}

export async function authenticateBiometric() {
  const support = await checkBiometricSupport();
  if (!support.supported) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock PulseSpend",
    cancelLabel: "Use password",
    disableDeviceFallback: false,
  });

  return result.success;
}
