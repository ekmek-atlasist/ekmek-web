export type PendingUserConsents = {
  termsAccepted: boolean;
  privacyNoticeAcknowledged: boolean;
  marketingConsent: boolean;
};

const PENDING_CONSENTS_SESSION_KEY = "ekmek_pending_user_consents";

export function storePendingUserConsents(consents: PendingUserConsents) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_CONSENTS_SESSION_KEY, JSON.stringify(consents));
}

export function getPendingUserConsents(): PendingUserConsents | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(PENDING_CONSENTS_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingUserConsents>;
    if (
      typeof parsed.termsAccepted !== "boolean" ||
      typeof parsed.privacyNoticeAcknowledged !== "boolean" ||
      typeof parsed.marketingConsent !== "boolean"
    ) {
      return null;
    }
    return {
      termsAccepted: parsed.termsAccepted,
      privacyNoticeAcknowledged: parsed.privacyNoticeAcknowledged,
      marketingConsent: parsed.marketingConsent,
    };
  } catch {
    return null;
  }
}

export function clearPendingUserConsents() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_CONSENTS_SESSION_KEY);
}
