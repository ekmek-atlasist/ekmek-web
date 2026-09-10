import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
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

export async function signInWithGooglePopup(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithApplePopup(): Promise<UserCredential> {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return signInWithPopup(auth, provider);
}
