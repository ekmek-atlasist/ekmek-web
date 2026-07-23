"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { EmployerMobileNoticeModal } from "./employer-mobile-notice-modal";
import { useState } from "react";

type LandingHeroProps = {
  onScrollToApp: () => void;
};

export function LandingHero({ onScrollToApp }: LandingHeroProps) {
  const isMobile = useIsMobile();
  const [employerNoticeOpen, setEmployerNoticeOpen] = useState(false);

  function scrollToNextSection() {
    const next = document.getElementById("nasil-calisir");
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section
        id="hero"
        className="relative h-[100svh] min-h-[100dvh] w-full overflow-hidden"
        aria-label="Tanıtım"
      >
        <video
          className="absolute inset-0 z-0 size-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-[1] bg-black/50" aria-hidden />

        <div className="pointer-events-none absolute right-1.5 bottom-[1.5%] z-[2] md:right-4 md:bottom-[3%]">
          <Image
            src="/ekmek_icon.svg"
            alt="Ekmek"
            width={80}
            height={80}
            className="size-16 rounded-xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)] md:size-20"
            priority
          />
        </div>

        <div className="relative z-10 flex h-full w-full flex-col items-start justify-end pt-[calc(72px+2rem)] pr-6 pb-[12%] pl-[8%] text-left md:pr-10 md:pb-[10%] md:pl-[10%]">
          <h1 className="max-w-[min(100%,42rem)] text-4xl leading-[1.02] font-black tracking-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl lg:text-7xl">
            İşe giden yolun en kısası.
          </h1>
          <p className="mt-4 max-w-[34rem] text-base leading-relaxed text-white/85 sm:mt-5 sm:text-lg md:text-xl">
            İş arayanları ve işverenleri saniyeler içinde buluşturan yeni nesil
            iş platformu.
          </p>

          <div className="mt-7 flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onScrollToApp}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0f2540] transition-colors hover:bg-neutral-100 sm:text-base"
            >
              Uygulamayı İndir
            </button>

            {isMobile ? (
              <button
                type="button"
                onClick={() => setEmployerNoticeOpen(true)}
                className="rounded-full bg-[#036AAF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] sm:text-base"
              >
                İşveren Girişi
              </button>
            ) : (
              <Link
                href="/isveren/giris"
                className="inline-flex items-center justify-center rounded-full bg-[#036AAF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#025a94] sm:text-base"
              >
                İşveren Girişi
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToNextSection}
          className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70 transition-colors hover:text-white"
          aria-label="Aşağı kaydır"
        >
          <ChevronDown className="size-6 animate-bounce" aria-hidden />
        </button>
      </section>

      <EmployerMobileNoticeModal
        open={employerNoticeOpen}
        onClose={() => setEmployerNoticeOpen(false)}
        onDownloadApp={onScrollToApp}
      />
    </>
  );
}
