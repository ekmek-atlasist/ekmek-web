const DEFAULT_APP_STORE_URL =
  "https://apps.apple.com/tr/app/id6780464276";
const DEFAULT_GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.atlas.ekmek.ekmek&hl=tr";

function fromEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

/** App Store — `NEXT_PUBLIC_APP_STORE_URL` ile override edilebilir */
export const APP_STORE_URL =
  fromEnv(process.env.NEXT_PUBLIC_APP_STORE_URL) || DEFAULT_APP_STORE_URL;

/** Google Play — `NEXT_PUBLIC_GOOGLE_PLAY_URL` ile override edilebilir */
export const GOOGLE_PLAY_URL =
  fromEnv(process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL) || DEFAULT_GOOGLE_PLAY_URL;

export function hasAppStoreLinks(): boolean {
  return Boolean(APP_STORE_URL || GOOGLE_PLAY_URL);
}

/** Cihaza göre uygun mağaza linki (hero / modal indir butonu için). */
export function getPreferredStoreUrl(userAgent?: string): string | null {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (/iPhone|iPad|iPod/i.test(ua) && APP_STORE_URL) {
    return APP_STORE_URL;
  }
  if (/Android/i.test(ua) && GOOGLE_PLAY_URL) {
    return GOOGLE_PLAY_URL;
  }

  return APP_STORE_URL || GOOGLE_PLAY_URL || null;
}

/** Mağazaya yönlendir; link yoksa false döner. */
export function openPreferredAppStore(userAgent?: string): boolean {
  const url = getPreferredStoreUrl(userAgent);
  if (!url || typeof window === "undefined") return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
