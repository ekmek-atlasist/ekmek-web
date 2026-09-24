import { LandingAppDownload } from "./landing-app-download";
import { LandingAppFeatures } from "./landing-app-features";
import { LandingAudience } from "./landing-audience";
import { LandingCategories } from "./landing-categories";
import { LandingFaq } from "./landing-faq";
import { LandingHero } from "./landing-hero";

export function LandingPage() {
  return (
    <>
      <LandingHero />
      <LandingCategories />
      <LandingAudience />
      <LandingAppFeatures />
      <LandingAppDownload />
      <LandingFaq />
    </>
  );
}
