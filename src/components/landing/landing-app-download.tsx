"use client";

import { Apple } from "lucide-react";
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

function PhoneMockup({
  label,
  tilt,
}: {
  label: string;
  tilt: string;
}) {
  return (
    <div
      className={`relative mx-auto w-[11.5rem] sm:w-[12.5rem] ${tilt}`}
    >
      <div className="rounded-[2.5rem] border-[10px] border-[#0f2540] bg-[#0f2540] p-1 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="overflow-hidden rounded-[2rem] bg-neutral-200">
          <div className="flex h-[22rem] flex-col items-center justify-center bg-gradient-to-b from-neutral-100 to-neutral-200 px-4 text-center sm:h-[24rem]">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f2540]/45">
              Placeholder
            </span>
            <p className="mt-2 text-sm font-medium leading-snug text-[#0f2540]/70">
              {label}
            </p>
            {/*
              Gerçek ekran görüntüsü için:
              <Image src="/screenshots/feed.png" alt="" fill className="object-cover" />
            */}
          </div>
        </div>
      </div>
      <div className="absolute top-3 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/80" />
    </div>
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
      <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </span>
      <span className="text-left">
        <span className="block text-[10px] uppercase tracking-wide text-white/70">
          {subtitle}
        </span>
        <span className="block text-sm font-semibold text-white">{title}</span>
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
        className="inline-flex w-full items-center gap-3 rounded-2xl bg-black px-4 py-3.5 transition-colors hover:bg-neutral-900 sm:w-auto sm:min-w-[15rem]"
      >
        {content}
      </a>
    );
  }

  return (
    <div
      aria-disabled="true"
      className="inline-flex w-full cursor-not-allowed items-center gap-3 rounded-2xl bg-black/80 px-4 py-3.5 opacity-90 sm:w-auto sm:min-w-[15rem]"
    >
      {content}
    </div>
  );
}

export function LandingAppDownload() {
  return (
    <section
      id="uygulama"
      className="scroll-mt-[72px] bg-[#0f2540] px-6 py-20 md:px-10 md:py-28"
      aria-labelledby="uygulama-baslik"
    >
      <FadeInSection className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="uygulama-baslik"
            className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Ekmek&apos;i cebine indir
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
            İş aramak hiç bu kadar kolay olmamıştı. Uygulamayı indir, birkaç
            dakikada profilini oluştur.
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="flex w-full max-w-xl items-end justify-center gap-4 sm:gap-6 lg:max-w-none lg:flex-1">
            <PhoneMockup
              label="Ekran görüntüsü yakında"
              tilt="-rotate-6 translate-y-3 opacity-90"
            />
            <PhoneMockup
              label="Ekran görüntüsü yakında"
              tilt="relative z-[1] scale-105"
            />
            <PhoneMockup
              label="Ekran görüntüsü yakında"
              tilt="rotate-6 translate-y-3 opacity-90 hidden sm:block"
            />
          </div>

          <div className="flex w-full max-w-md flex-col items-center gap-3 lg:items-start">
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
      </FadeInSection>
    </section>
  );
}
