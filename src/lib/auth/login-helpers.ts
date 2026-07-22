import { FirebaseError } from "firebase/app";

export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function formatPhoneForDisplay(digits: string): string {
  return `+90 ${formatPhoneInput(digits)}`.trim();
}

export function formatPhoneInput(digits: string): string {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

export function isValidPhoneDigits(digits: string): boolean {
  return digits.length === 10 && digits.startsWith("5");
}

export function isValidOtpCode(code: string): boolean {
  return code.length === 6;
}

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-phone-number":
      return "Geçersiz telefon numarası. 10 haneli bir numara gir.";
    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar dene.";
    case "auth/invalid-verification-code":
      return "Doğrulama kodu yanlış.";
    case "auth/code-expired":
      return "Kodun süresi doldu. Yeni kod iste.";
    case "auth/missing-verification-code":
      return "Lütfen 6 haneli kodu gir.";
    case "auth/captcha-check-failed":
      return "Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar dene.";
    case "auth/invalid-app-credential":
      return "Güvenlik doğrulaması başarısız (reCAPTCHA). Sayfayı yenileyip tekrar dene.";
    case "auth/app-not-authorized":
      return "Bu alan adı yetkili değil. Site yöneticisiyle iletişime geç.";
    case "auth/operation-not-allowed":
      return "Telefon ile giriş şu an kapalı.";
    case "auth/quota-exceeded":
      return "SMS gönderim limiti doldu. Lütfen daha sonra tekrar dene.";
    case "auth/missing-client-identifier":
      return "Güvenlik doğrulaması kurulamadı. Sayfayı yenile.";
    default:
      return "Bir hata oluştu. Lütfen tekrar dene.";
  }
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return getAuthErrorMessage(error.code);
  }
  return "Bir hata oluştu. Lütfen tekrar dene.";
}
