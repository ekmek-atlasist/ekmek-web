"use client";

import { GLOBAL_HEADER_HEIGHT_PX } from "@/lib/layout-constants";
import { LandingAppDownload } from "./landing-app-download";
import { LandingCategories } from "./landing-categories";
import { LandingFaq } from "./landing-faq";
import { LandingFeatures } from "./landing-features";
import { LandingHero } from "./landing-hero";
import { LandingHowItWorks } from "./landing-how-it-works";

export function LandingPage() {
  function scrollToApp() {
    const section = document.getElementById("uygulama");
    if (!section) return;

    const top = section.offsetTop - GLOBAL_HEADER_HEIGHT_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  return (
    <>
      <LandingHero onScrollToApp={scrollToApp} />

      {/* Header'daki #notify linki bu bölüme kaydırır */}
      <div id="notify" className="scroll-mt-[72px]" aria-hidden />

      <LandingHowItWorks />
      <LandingFeatures />
      <LandingCategories />
      <LandingAppDownload />
      <LandingFaq />
    </>
  );
}
