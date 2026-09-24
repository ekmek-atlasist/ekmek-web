import Image from "next/image";
import { MASCOT_IMAGES } from "@/lib/data/category-icons";
import { FadeInSection } from "./fade-in-section";

const features = [
  {
    title: "Keşfet & eşleş",
    description: "Sana uygun ilanları kaydır, beğendiğin pozisyonlara anında başvur.",
    image: MASCOT_IMAGES.discover,
    alt: "Ekmek uygulamasında ilan keşfetme",
  },
  {
    title: "Başvurularını takip et",
    description: "Tüm başvuruların tek ekranda; durumunu anlık gör.",
    image: MASCOT_IMAGES.applications,
    alt: "Ekmek uygulamasında başvuru takibi",
  },
  {
    title: "Anında mesajlaş",
    description: "Eşleştiğin işverenle uygulama içinden doğrudan konuş.",
    image: MASCOT_IMAGES.chat,
    alt: "Ekmek uygulamasında mesajlaşma",
  },
  {
    title: "Profilini oluştur",
    description: "CV yüklemeden profilini tamamla, öne çık.",
    image: MASCOT_IMAGES.profile,
    alt: "Ekmek uygulamasında profil oluşturma",
  },
] as const;

export function LandingAppFeatures() {
  return (
    <section
      className="relative overflow-hidden bg-[#eef3f8] px-6 py-12 md:px-10 md:py-16"
      aria-labelledby="ozellikler-baslik"
    >
      <div
        className="pointer-events-none absolute -right-24 top-0 size-72 rounded-full bg-[#036AAF]/10 blur-3xl"
        aria-hidden
      />

      <FadeInSection className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="ozellikler-baslik"
            className="text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
          >
            Her adımda yanında
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#1a1a1a]/55 sm:text-lg">
            Keşfetmekten mesajlaşmaya kadar iş arama sürecinin tamamı tek
            uygulamada.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 sm:gap-5">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-neutral-200/60 bg-white shadow-[0_8px_32px_rgba(15,37,64,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(3,106,175,0.1)] sm:flex-row sm:items-end"
            >
              <div className="flex flex-1 flex-col justify-center p-6 sm:p-7">
                <h3 className="text-lg font-bold text-[#0f2540] sm:text-xl">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#1a1a1a]/55 sm:text-[0.9375rem]">
                  {feature.description}
                </p>
              </div>
              <div className="relative flex shrink-0 items-end justify-center px-4 pb-0 pt-2 sm:w-[44%] sm:px-2">
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  width={360}
                  height={360}
                  className="h-auto max-h-[11rem] w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-[1.04] sm:max-h-[12.5rem]"
                  sizes="(max-width: 640px) 50vw, 240px"
                />
              </div>
            </article>
          ))}
        </div>
      </FadeInSection>
    </section>
  );
}
