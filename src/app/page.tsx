import Image from "next/image";
import Header from "../components/header";
import { NotifyForm } from "../components/notify-form";
import { SiteFooter } from "../components/site-footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      <section
        id="hero"
        className="relative h-[100dvh] overflow-hidden"
        aria-label="Tanıtım"
      >
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 z-[1] bg-black/50"
          aria-hidden
        />

        <div className="pointer-events-none absolute bottom-[1.5%] right-1.5 z-[2] md:bottom-[3%] md:right-4">
          <Image
            src="/ekmek_icon.svg"
            alt="Ekmek"
            width={80}
            height={80}
            className="size-16 rounded-xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)] md:size-20"
            priority
          />
        </div>

        <div className="relative z-10 flex h-full w-full flex-col justify-end items-start pl-[8%] pr-6 pb-[8%] pt-[calc(72px+2rem)] text-left md:pl-[10%] md:pb-[10%] md:pr-10">
          <h1 className="max-w-[min(100%,42rem)] text-5xl font-black leading-[0.95] tracking-tight text-white drop-shadow-sm sm:text-6xl md:text-7xl">
            İşe giden yolun en kısası.
          </h1>
          <p className="mt-5 max-w-[500px] text-lg leading-relaxed text-white/80 md:mt-6">
            Ekmek, iş arayanlarla işverenleri
            <br />
            saniyeler içinde buluşturur.
          </p>
        </div>
      </section>

      {/* Tek ekranda: form + footer; büyük ekranda yükseklik viewport - header */}
      <div
        id="notify"
        className="scroll-mt-[72px] flex min-h-[calc(100dvh-72px)] flex-col lg:h-[calc(100dvh-72px)] lg:max-h-[calc(100dvh-72px)] lg:overflow-hidden"
      >
        <section
          className="flex min-h-0 flex-1 flex-col justify-center bg-[#0f2540] px-6 py-8 md:px-10 md:py-10"
          aria-labelledby="notify-baslik"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <h2
              id="notify-baslik"
              className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Yayınlandığında ilk sen haberdar ol
            </h2>
            <p className="mt-3 max-w-xl text-base text-white/85 md:mt-4 md:text-lg">
              Ekmek yayına çıktığında e-posta ile haberdar olmak ister misin?
            </p>

            <NotifyForm />
          </div>
        </section>

        <SiteFooter compact className="shrink-0" />
      </div>
    </main>
  );
}
