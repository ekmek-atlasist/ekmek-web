import { Briefcase, Sparkles } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/data/job-categories";
import { FadeInSection } from "./fade-in-section";

function CategoryChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#036AAF]/12 bg-white/90 px-5 py-2.5 text-sm font-medium text-[#0f2540] shadow-[0_2px_12px_rgba(15,37,64,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#036AAF]/25 hover:shadow-[0_8px_24px_rgba(3,106,175,0.12)]">
      <span className="size-1.5 shrink-0 rounded-full bg-[#036AAF]" aria-hidden />
      {label}
    </span>
  );
}

function MarqueeRow({
  categories,
  reverse = false,
}: {
  categories: typeof JOB_CATEGORIES;
  reverse?: boolean;
}) {
  const items = [...categories, ...categories];

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div
        className={`flex w-max gap-3 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}
      >
        {items.map((category, index) => (
          <CategoryChip key={`${category.id}-${index}`} label={category.label} />
        ))}
      </div>
    </div>
  );
}

export function LandingCategories() {
  const firstHalf = JOB_CATEGORIES.slice(0, 13);
  const secondHalf = JOB_CATEGORIES.slice(13);

  return (
    <section
      id="kategoriler"
      className="relative scroll-mt-[72px] overflow-hidden bg-[#fafbfc] px-6 py-20 md:px-10 md:py-28"
      aria-labelledby="kategoriler-baslik"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(3,106,175,0.07),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/2 size-64 -translate-y-1/2 rounded-full bg-[#036AAF]/5 blur-3xl"
        aria-hidden
      />

      <FadeInSection className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#036AAF] shadow-sm ring-1 ring-[#036AAF]/10">
            <Sparkles className="size-3.5" aria-hidden />
            24 farklı sektör
          </span>
          <h2
            id="kategoriler-baslik"
            className="mt-5 text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
          >
            Her sektörden iş burada
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#1a1a1a]/55 sm:text-lg">
            İnşaattan sağlığa, lojistikten restorana — aradığın pozisyon hangi
            alanda olursa olsun, Ekmek&apos;te seni bekliyor.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#036AAF]/10 text-[#036AAF]">
              <Briefcase className="size-5" strokeWidth={2} aria-hidden />
            </span>
            <div className="text-left">
              <p className="text-2xl font-black tabular-nums text-[#0f2540]">24+</p>
              <p className="text-xs font-medium text-[#1a1a1a]/50">Sektör kategorisi</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-5 py-3 shadow-sm backdrop-blur-sm">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#0f2540]/8 text-[#0f2540]">
              <Sparkles className="size-5" strokeWidth={2} aria-hidden />
            </span>
            <div className="text-left">
              <p className="text-2xl font-black text-[#0f2540]">Hızlı</p>
              <p className="text-xs font-medium text-[#1a1a1a]/50">Kaydır, eşleş, başla</p>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4 rounded-[2rem] border border-neutral-200/50 bg-white/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm sm:p-6">
          <MarqueeRow categories={firstHalf} />
          <MarqueeRow categories={secondHalf} reverse />
        </div>
      </FadeInSection>
    </section>
  );
}
