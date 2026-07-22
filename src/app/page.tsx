import Image from "next/image";
import { FinishSignOutOnMount } from "../components/finish-sign-out-on-mount";
import { NotifyForm } from "../components/notify-form";

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white">
      <FinishSignOutOnMount />
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

        <div className="relative z-10 flex h-full w-full flex-col items-start justify-end pt-[calc(72px+2rem)] pr-6 pb-[8%] pl-[8%] text-left md:pr-10 md:pb-[10%] md:pl-[10%]">
          <h1 className="max-w-[min(100%,42rem)] text-5xl leading-[0.95] font-black tracking-tight text-white drop-shadow-sm sm:text-6xl md:text-7xl">
            İşe giden yolun en kısası.
          </h1>
          <p className="mt-5 max-w-[500px] text-3xl leading-relaxed text-white/80 md:mt-6">
            Yakında Sizlerle...
          </p>
        </div>
      </section>

      <div id="notify" className="scroll-mt-[72px]">
        <section
          className="bg-[#0f2540] px-6 py-16 md:px-10 md:py-20"
          aria-labelledby="notify-baslik"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <h2
              id="notify-baslik"
              className="text-3xl leading-tight font-black tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Yayınlandığında ilk sen haberdar ol
            </h2>
            <p className="mt-3 max-w-xl text-base text-white/85 md:mt-4 md:text-lg">
              Ekmek yayına çıktığında e-posta ile haberdar olmak ister misin?
            </p>

            <NotifyForm />
          </div>
        </section>
      </div>
    </main>
  );
}
