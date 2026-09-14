"use client";

import { GLOBAL_HEADER_HEIGHT_PX } from "@/lib/layout-constants";
import { LandingAppDownload } from "./landing-app-download";
import { LandingAppFeatures } from "./landing-app-features";
import { LandingAudience } from "./landing-audience";
import { LandingCategories } from "./landing-categories";
import { LandingFaq } from "./landing-faq";
import { LandingHero } from "./landing-hero";

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
      <LandingCategories />
      <LandingAudience />
      <LandingAppFeatures />
      <LandingAppDownload />
      <LandingFaq />
    </>
  );
}
