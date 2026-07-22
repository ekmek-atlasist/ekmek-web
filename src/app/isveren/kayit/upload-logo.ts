import { FirebaseError } from "firebase/app";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadCorporateLogo(
  uid: string,
  blob: Blob,
): Promise<string> {
  const storageRef = ref(storage, `company_logos/${uid}/logo.jpg`);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}

export function getStorageErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "storage/unauthorized":
        return "Fotoğraf yükleme izni yok. Firebase Storage kurallarını kontrol et.";
      case "storage/canceled":
        return "Fotoğraf yükleme iptal edildi.";
      case "storage/unknown":
        return "Fotoğraf yüklenirken bilinmeyen bir hata oluştu.";
      case "storage/object-not-found":
        return "Yüklenen dosya bulunamadı.";
      case "storage/quota-exceeded":
        return "Depolama kotası doldu.";
      default:
        return `Fotoğraf yüklenemedi (${error.code}).`;
    }
  }
  return "Fotoğraf yüklenemedi. Lütfen tekrar dene.";
}
