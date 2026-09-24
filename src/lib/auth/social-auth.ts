import { FirebaseError } from "firebase/app";
import {
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type AuthProvider,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/*
 * Firebase Console → Authentication → Sign-in method:
 * Google ve Apple sağlayıcıları ETKİN olmalıdır.
 * Apple için Apple Developer tarafında Service ID + domain doğrulaması gerekir.
 */

export type EmployerAuthRoute = "kayit" | "panel" | "bireysel" | "unknown";

type UserDoc = {
  userType?: string;
};

function providerLabel(provider?: "google" | "apple"): string {
  if (provider === "apple") return "Apple";
  if (provider === "google") return "Google";
  return "Sosyal";
}

export function getSocialAuthErrorMessage(
  error: unknown,
  provider?: "google" | "apple",
): string | null {
  if (error instanceof FirebaseError) {
    if (
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request"
    ) {
      return null;
    }

    if (error.code === "auth/operation-not-allowed") {
      return `${providerLabel(provider)} ile giriş henüz etkin değil. Telefon ile devam edebilirsin.`;
    }

    if (error.code === "auth/account-exists-with-different-credential") {
      return "Bu e-posta başka bir giriş yöntemiyle kayıtlı.";
    }

    if (error.code === "auth/popup-blocked") {
      return "Açılır pencere engellendi, lütfen izin verin.";
    }
  }

  return "Giriş yapılamadı, tekrar deneyin.";
}

const HANDLED_SOCIAL_AUTH_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-allowed",
  "auth/account-exists-with-different-credential",
  "auth/popup-blocked",
]);

export function isHandledSocialAuthError(error: unknown): boolean {
  return (
    error instanceof FirebaseError && HANDLED_SOCIAL_AUTH_CODES.has(error.code)
  );
}

export async function resolveEmployerAuthRoute(
  uid: string,
): Promise<EmployerAuthRoute> {
  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    return "kayit";
  }

  const data = userDoc.data() as UserDoc;

  if (data.userType === "kurumsal") {
    return "panel";
  }

  if (data.userType === "bireysel") {
    return "bireysel";
  }

  return "unknown";
}

function createProvider(provider: "google" | "apple"): AuthProvider {
  if (provider === "apple") {
    const appleProvider = new OAuthProvider("apple.com");
    appleProvider.addScope("email");
    appleProvider.addScope("name");
    return appleProvider;
  }
  return new GoogleAuthProvider();
}

export async function signInWithGooglePopup(): Promise<UserCredential> {
  return signInWithPopup(auth, createProvider("google"));
}

export async function signInWithApplePopup(): Promise<UserCredential> {
  return signInWithPopup(auth, createProvider("apple"));
}

/*
 * Açılır pencere engellendiğinde (tarayıcı ayarı, Instagram/Facebook gibi
 * uygulama içi tarayıcılar) aynı sekmede yönlendirme ile devam ederiz.
 */
const POPUP_UNSUPPORTED_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);

export function isPopupUnsupportedError(error: unknown): boolean {
  return (
    error instanceof FirebaseError && POPUP_UNSUPPORTED_CODES.has(error.code)
  );
}

const PENDING_REDIRECT_KEY = "ekmek:pending-social-redirect";

export function readPendingSocialRedirect(): "google" | "apple" | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(PENDING_REDIRECT_KEY);
    return value === "google" || value === "apple" ? value : null;
  } catch {
    return null;
  }
}

export function clearPendingSocialRedirect(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_REDIRECT_KEY);
  } catch {
    /* sessionStorage kapalı olabilir */
  }
}

export async function startSocialRedirect(
  provider: "google" | "apple",
): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(PENDING_REDIRECT_KEY, provider);
    } catch {
      /* sessionStorage kapalı olabilir */
    }
  }
  await signInWithRedirect(auth, createProvider(provider));
}

export async function consumeSocialRedirectResult(): Promise<UserCredential | null> {
  try {
    return await getRedirectResult(auth);
  } finally {
    clearPendingSocialRedirect();
  }
}
