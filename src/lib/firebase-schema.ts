/**
 * Mobil uygulama ile uyumlu Firestore alan formatları.
 * Koleksiyon bazında createdAt / updatedAt tipi farklı — karıştırma.
 */
export function firestoreIsoNow(): string {
  return new Date().toISOString();
}

/**
 * Mesajlaşma (messages, conversations, matches) için mobil uyumlu tarih.
 * Mobil yerel duvar saatini timezone suffix olmadan yazar; `toISOString()` (Z)
 * mobilde UTC olarak okunup Türkiye'de ~3 saat erken görünür.
 */
export function firestoreLocalIsoNow(): string {
  const date = new Date();
  const pad = (value: number, length = 2) =>
    String(value).padStart(length, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}
