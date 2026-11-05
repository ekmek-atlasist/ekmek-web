"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AppStoreButtons } from "@/components/app-store-buttons";

/** App Store uygulama id'si. Doluysa `https://apps.apple.com/app/id{id}`. */
const APP_STORE_ID = "";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.atlas.ekmek.ekmek";

const APP_STORE_URL = APP_STORE_ID
  ? `https://apps.apple.com/app/id${APP_STORE_ID}`
  : "";

const REDIRECT_DELAY_MS = 1500;

type Platform = "android" | "ios" | "desktop";

function detectPlatform(userAgent: string): Platform {
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  return "desktop";
}

export function ListingDeeplink() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    const detected = detectPlatform(navigator.userAgent);
    setPlatform(detected);

    if (detected === "android") {
      const timer = window.setTimeout(() => {
        window.location.assign(PLAY_STORE_URL);
      }, REDIRECT_DELAY_MS);
      return () => window.clearTimeout(timer);
    }

    if (detected === "ios" && APP_STORE_URL) {
      const timer = window.setTimeout(() => {
        window.location.assign(APP_STORE_URL);
      }, REDIRECT_DELAY_MS);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, []);

  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[#0f2540] px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <Image
          src="/ekmek_icon.svg"
          alt="Ekmek"
          width={72}
          height={72}
          className="size-[72px] rounded-2xl"
          priority
        />

        <h1 className="mt-6 text-xl font-bold leading-snug text-white sm:text-2xl">
          Bu ilanı görmek için Ekmek uygulamasını indir
        </h1>

        {platform === "ios" && !APP_STORE_URL ? (
          <p className="mt-6 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#7ec8ff]">
            Yakında App Store&apos;da
          </p>
        ) : (
          <AppStoreButtons className="mt-8" compact theme="dark" />
        )}

        <p className="mt-8 text-sm leading-relaxed text-white/55">
          Uygulamayı indirdiysen bu linke tekrar dokun.
        </p>
      </div>
    </main>
  );
}
