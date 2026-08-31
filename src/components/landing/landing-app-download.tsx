"use client";

import Image from "next/image";
import { Apple, Download, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
} from "@/lib/app-store-links";
import { FadeInSection } from "./fade-in-section";

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      role="presentation"
    >
      <path
        fill="currentColor"
        d="M3.6 1.8c-.3.2-.5.6-.5 1v18.4c0 .4.2.8.5 1l.1.1 10.3-10.3v-.2L3.7 1.7l-.1.1z"
      />
      <path
        fill="currentColor"
        d="M16.8 8.4 13.7 11.5l3.1 3.1 5.2-2.9c.9-.5.9-1.3 0-1.8l-5.2-2.5z"
      />
      <path
        fill="currentColor"
        d="M13.7 12.5 16.8 9.4 6.5 2.1l7.2 7.2z"
      />
      <path
        fill="currentColor"
        d="M6.5 21.9l10.3-7.3-3.1-3.1-7.2 7.2z"
      />
    </svg>
  );
}

function StoreButton({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  const enabled = href.length > 0;
  const content = (
    <>
      <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
        {icon}
      </span>
      <span className="text-left">
        <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-white/65">
          {subtitle}
        </span>
        <span className="block text-sm font-semibold text-white sm:text-[0.9375rem]">
          {title}
        </span>
      </span>
      {!enabled ? (
        <span className="ml-auto rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/85">
          Çok yakında
        </span>
      ) : null}
    </>
  );

  if (enabled && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3.5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.12] hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] sm:w-auto sm:min-w-[16rem]"
      >
        {content}
      </a>
    );
  }

  return (
    <div
      aria-disabled="true"
      className="inline-flex w-full cursor-not-allowed items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.05] px-4 py-3.5 opacity-80 sm:w-auto sm:min-w-[16rem]"
    >
      {content}
    </div>
  );
}

const screenshots = [
  {
    src: "/screenshots/app-feed.png",
    alt: "Ekmek uygulamasında ilan kaydırma ekranı",
    tilt: "-rotate-3 sm:-rotate-6",
    zIndex: "z-[1]",
  },
  {
    src: "/screenshots/app-profile.png",
    alt: "Ekmek uygulamasında profil oluşturma ekranı",
    tilt: "rotate-3 sm:rotate-6",
    zIndex: "z-[2]",
  },
];

export function LandingAppDownload() {
  return (
    <section
      id="uygulama"
      className="relative scroll-mt-[72px] overflow-hidden bg-[#0f2540] px-6 py-20 md:px-10 md:py-28"
      aria-labelledby="uygulama-baslik"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_50%,rgba(3,106,175,0.25),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-0 size-96 rounded-full bg-[#036AAF]/10 blur-3xl"
        aria-hidden
      />

      <FadeInSection className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7ec8ff]">
              <Download className="size-3.5" aria-hidden />
              Mobil uygulama
            </span>
            <h2
              id="uygulama-baslik"
              className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
            >
              Ekmek&apos;i cebine indir
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0 mx-auto">
              Profilini dakikalar içinde oluştur, sana uygun ilanları keşfet ve
              eşleştiğin işverenle anında konuş — hepsi telefonundan.
            </p>

            <ul className="mt-8 hidden space-y-3 text-left sm:block">
              {[
                "Kayıt ücretsiz, dakikalar içinde başla",
                "CV yüklemeden profilini tamamla",
                "Eşleşince doğrudan mesajlaş",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-white/75"
                >
                  <Sparkles className="size-4 shrink-0 text-[#7ec8ff]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-center gap-3 lg:items-start">
              <StoreButton
                href={APP_STORE_URL}
                icon={<Apple className="size-5" aria-hidden />}
                subtitle="Download on the"
                title="App Store'dan İndir"
              />
              <StoreButton
                href={GOOGLE_PLAY_URL}
                icon={<GooglePlayIcon className="size-5" />}
                subtitle="Get it on"
                title="Google Play'den İndir"
              />
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-lg items-end justify-center gap-3 sm:gap-5 lg:max-w-none lg:justify-end">
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f2540] to-transparent lg:hidden"
              aria-hidden
            />
            {screenshots.map(({ src, alt, tilt, zIndex }) => (
              <div
                key={src}
                className={`relative w-[46%] max-w-[13rem] transition-transform duration-500 hover:-translate-y-2 sm:max-w-[14.5rem] ${tilt} ${zIndex}`}
              >
                <Image
                  src={src}
                  alt={alt}
                  width={580}
                  height={1160}
                  className="h-auto w-full drop-shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
                  sizes="(max-width: 640px) 46vw, 14.5rem"
                />
              </div>
            ))}
          </div>
        </div>
      </FadeInSection>
    </section>
  );
}
