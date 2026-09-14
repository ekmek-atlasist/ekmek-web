"use client";

import { Apple, Check } from "lucide-react";
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
      <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </span>
      <span className="text-left">
        <span className="block text-[10px] font-medium uppercase tracking-wider text-white/60">
          {subtitle}
        </span>
        <span className="block text-sm font-semibold text-white">{title}</span>
      </span>
      {!enabled ? (
        <span className="ml-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
          Yakında
        </span>
      ) : null}
    </>
  );

  const className =
    "inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.1]";

  if (enabled && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <div aria-disabled="true" className={`${className} cursor-default opacity-75`}>
      {content}
    </div>
  );
}

const highlights = [
  {
    title: "Ücretsiz kayıt",
    description: "Dakikalar içinde profilini oluştur.",
  },
  {
    title: "CV gerekmez",
    description: "Adım adım profil doldurma.",
  },
  {
    title: "Doğrudan mesaj",
    description: "Eşleşince anında iletişim.",
  },
] as const;

export function LandingAppDownload() {
  return (
    <section
      id="uygulama"
      className="relative scroll-mt-[72px] overflow-hidden bg-[#0f2540] px-6 py-12 md:px-10 md:py-16"
      aria-labelledby="uygulama-baslik"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(3,106,175,0.2),transparent)]"
        aria-hidden
      />

      <FadeInSection className="relative mx-auto max-w-3xl">
        <div className="text-center">
          <h2
            id="uygulama-baslik"
            className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-[1.12]"
          >
            Ekmek&apos;i cebine indir
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
            Profilini oluştur, ilanları keşfet, eşleştiğin işverenle konuş —
            hepsi telefonundan.
          </p>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {highlights.map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-white/8 bg-white/[0.04] px-4 py-4 text-left"
            >
              <span className="mb-2 flex size-6 items-center justify-center rounded-full bg-[#036AAF]/30">
                <Check className="size-3.5 text-[#7ec8ff]" strokeWidth={2.5} aria-hidden />
              </span>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                {item.description}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <StoreButton
            href={APP_STORE_URL}
            icon={<Apple className="size-5" aria-hidden />}
            subtitle="Download on the"
            title="App Store"
          />
          <StoreButton
            href={GOOGLE_PLAY_URL}
            icon={<GooglePlayIcon className="size-5" />}
            subtitle="Get it on"
            title="Google Play"
          />
        </div>
      </FadeInSection>
    </section>
  );
}
