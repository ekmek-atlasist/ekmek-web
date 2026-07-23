import { FinishSignOutOnMount } from "../components/finish-sign-out-on-mount";
import { LandingPage } from "../components/landing/landing-page";

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white">
      <FinishSignOutOnMount />
      <LandingPage />
    </main>
  );
}
