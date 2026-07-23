import { JOB_CATEGORIES } from "@/lib/data/job-categories";
import { FadeInSection } from "./fade-in-section";

function CategoryChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-neutral-200/80 bg-white px-4 py-2 text-sm font-medium text-[#0f2540] shadow-sm">
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
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
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
  const firstHalf = JOB_CATEGORIES.slice(0, 12);
  const secondHalf = JOB_CATEGORIES.slice(12);

  return (
    <section
      className="overflow-hidden bg-[#f8f9fb] px-6 py-20 md:px-10 md:py-28"
      aria-labelledby="kategoriler-baslik"
    >
      <FadeInSection>
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="kategoriler-baslik"
            className="text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl lg:text-5xl"
          >
            Her sektörden iş burada
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#1a1a1a]/65 md:text-lg">
            Aradığın pozisyon hangi alanda olursa olsun, Ekmek&apos;te var.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <MarqueeRow categories={firstHalf} />
          <MarqueeRow categories={secondHalf} reverse />
        </div>
      </FadeInSection>
    </section>
  );
}
