import {
  BadgeCheck,
  Hand,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { FadeInSection } from "./fade-in-section";

const features = [
  {
    title: "Kaydırarak eşleş",
    description: "Uzun formlar yok. Beğen, eşleş, başla.",
    icon: Hand,
  },
  {
    title: "Anlık mesajlaşma",
    description: "Eşleştiğin an sohbete başla, zaman kaybetme.",
    icon: MessageSquare,
  },
  {
    title: "Konuma göre iş",
    description: "Sana en yakın işleri ve adayları gör.",
    icon: MapPin,
  },
  {
    title: "24 farklı sektör",
    description:
      "İnşaattan sağlığa, lojistikten restorana binlerce pozisyon.",
    icon: BadgeCheck,
  },
  {
    title: "Hızlı başvuru",
    description: "CV yükleme derdi yok, profilin yeterli.",
    icon: Zap,
  },
  {
    title: "Güvenli ve şeffaf",
    description: "KVKK uyumlu, doğrulanmış kullanıcılar.",
    icon: ShieldCheck,
  },
];

export function LandingFeatures() {
  return (
    <section
      className="bg-[#0f2540] px-6 py-20 md:px-10 md:py-28"
      aria-labelledby="ozellikler-baslik"
    >
      <FadeInSection className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="ozellikler-baslik"
            className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Neden Ekmek?
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {features.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#036AAF]/25 text-[#7ec8ff]">
                <Icon className="size-5" strokeWidth={2} aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {description}
              </p>
            </article>
          ))}
        </div>
      </FadeInSection>
    </section>
  );
}
