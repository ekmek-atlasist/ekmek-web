import { serverTimestamp, type FieldValue } from "firebase/firestore";

/** Mobil uygulama ile aynı sürüm etiketi. */
export const USER_CONSENT_VERSION = "2026-06-09";

export type UserConsentsInput = {
  termsAccepted: boolean;
  privacyNoticeAcknowledged: boolean;
  marketingConsent: boolean;
};

export type UserConsentsDocument = {
  termsAccepted: boolean;
  termsAcceptedAt: FieldValue | null;
  termsVersion: string;
  privacyNoticeAcknowledged: boolean;
  privacyNoticeAckAt: FieldValue | null;
  privacyNoticeVersion: string;
  marketingConsent: boolean;
  marketingConsentAt: FieldValue | null;
  marketingConsentVersion: string | null;
};

/** Mobil `users.consents` map yapısı ile uyumlu. */
export function buildUserConsents(
  input: UserConsentsInput,
): UserConsentsDocument {
  const now = serverTimestamp();

  return {
    termsAccepted: input.termsAccepted,
    termsAcceptedAt: input.termsAccepted ? now : null,
    termsVersion: USER_CONSENT_VERSION,
    privacyNoticeAcknowledged: input.privacyNoticeAcknowledged,
    privacyNoticeAckAt: input.privacyNoticeAcknowledged ? now : null,
    privacyNoticeVersion: USER_CONSENT_VERSION,
    marketingConsent: input.marketingConsent,
    marketingConsentAt: input.marketingConsent ? now : null,
    marketingConsentVersion: input.marketingConsent
      ? USER_CONSENT_VERSION
      : null,
  };
}
