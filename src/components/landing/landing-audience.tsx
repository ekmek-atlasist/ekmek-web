import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { AuthEntryButton } from "@/components/auth/auth-entry-button";
import { MASCOT_IMAGES } from "@/lib/data/category-icons";
import { FadeInSection } from "./fade-in-section";

const cards = [
  {
    title: "İş arıyorsan",
    description:
      "Profilini oluştur, sana uygun ilanları keşfet ve eşleştiğin işverenle anında konuş.",
    mascot: MASCOT_IMAGES.jobSeeker,
    mascotAlt: "İş arayanlar için Ekmek maskotu",
    icon: UserRound,
    note: "Uygulamayı indir, telefon numaranla dakikalar içinde başla.",
    cta: { label: "Uygulamayı indir", href: "#uygulama" },
  },
  {
    title: "İşverensen",
    description:
      "İlanını dakikalar içinde yayınla, adayları incele ve doğru kişiyi hızla bul.",
    mascot: MASCOT_IMAGES.employer,
    mascotAlt: "İşverenler için Ekmek maskotu",
    icon: Building2,
    note: "Uygulamayı indirebilir ya da bilgisayarından web panelini kullanabilirsin.",
    cta: null,
  },
] as const;

export function LandingAudience() {
  return (
    <section
      className="relative overflow-hidden bg-[#0f2540] px-6 py-12 md:px-10 md:py-16"
      aria-labelledby="kimler-baslik"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_20%,rgba(3,106,175,0.35),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 size-72 rounded-full bg-[#036AAF]/15 blur-3xl"
        aria-hidden
      />

      <FadeInSection className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="kimler-baslik"
            className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
          >
            Kimler için?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/70 sm:text-lg">
            İster aday ol ister ilan ver, Ekmek iki tarafı da aynı hızda
            buluşturur.
          </p>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2 md:gap-6">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="group relative rounded-[1.75rem] border border-white/10 bg-white/[0.07] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-8"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-sm">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7ec8ff] ring-1 ring-white/10">
                      <Icon className="size-3.5" aria-hidden />
                      {card.title}
                    </span>
                    <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
                      {card.description}
                    </p>
                    <p className="mt-2.5 text-xs leading-relaxed text-white/50 sm:text-sm">
                      {card.note}
                    </p>
                    <div className="mt-6">
                      {card.cta ? (
                        <Link
                          href={card.cta.href}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0f2540] transition-colors hover:bg-white/90"
                        >
                          {card.cta.label}
                          <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      ) : (
                        <AuthEntryButton label="Giriş" />
                      )}
                    </div>
                  </div>

                  <div className="relative mx-auto w-full max-w-[11rem] shrink-0 sm:mx-0 sm:max-w-[10rem]">
                    <Image
                      src={card.mascot}
                      alt={card.mascotAlt}
                      width={320}
                      height={400}
                      className="h-auto w-full object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 176px, 160px"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </FadeInSection>
    </section>
  );
}
