const VERIFIED_PHONE_SESSION_KEY = "ekmek_verified_phone_e164";

export function storeVerifiedPhoneE164(e164: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VERIFIED_PHONE_SESSION_KEY, e164);
}

export function getVerifiedPhoneE164(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(VERIFIED_PHONE_SESSION_KEY);
}

export function clearVerifiedPhoneE164() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(VERIFIED_PHONE_SESSION_KEY);
}
