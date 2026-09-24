"use client";

import { Check } from "lucide-react";
import { AppStoreButtons } from "@/components/app-store-buttons";
import { FadeInSection } from "./fade-in-section";

const highlights = [
  {
    title: "Ücretsiz kayıt",
    description: "Dakikalar içinde profilini oluştur.",
  },
  {
    title: "CV gerekmez",
    description: "Profilini adım adım doldur.",
  },
  {
    title: "Doğrudan mesaj",
    description: "Eşleştiğin işverenle hemen konuş.",
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
            Profilini oluştur, ilanları keşfet, eşleştiğin işverenle konuş.
            Hepsi telefonundan.
          </p>
        </div>

        <AppStoreButtons className="mt-7" theme="dark" />

        <ul className="mt-8 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {highlights.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-left"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#036AAF]/35">
                <Check
                  className="size-3 text-[#9ad4ff]"
                  strokeWidth={3}
                  aria-hidden
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-white/55">
                  {item.description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </FadeInSection>
    </section>
  );
}
