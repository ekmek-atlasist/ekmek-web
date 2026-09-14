"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { getCategoryIconPath } from "@/lib/data/category-icons";
import { JOB_CATEGORIES } from "@/lib/data/job-categories";
import { FadeInSection } from "./fade-in-section";

const SCROLL_STEP = 280;
const AUTO_SCROLL_SPEED = 0.55;

const CATEGORY_ROWS = [
  JOB_CATEGORIES.slice(0, 13),
  JOB_CATEGORIES.slice(13),
] as const;

export type CategoryCarouselHandle = {
  scroll: (direction: 1 | -1) => void;
};

function CategoryChip({ id, label }: { id: string; label: string }) {
  return (
    <article className="group relative flex w-[7rem] shrink-0 flex-col items-center rounded-2xl border border-white/90 bg-gradient-to-b from-white to-[#f8fbff] px-3 py-3.5 text-center shadow-[0_4px_20px_rgba(15,37,64,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-[#036AAF]/25 hover:shadow-[0_12px_32px_rgba(3,106,175,0.15)] sm:w-[7.75rem] sm:py-4">
      <div
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[#036AAF]/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative mb-2.5 flex size-12 items-center justify-center rounded-xl bg-[#036AAF]/[0.06] ring-1 ring-[#036AAF]/8 transition-all duration-300 group-hover:bg-[#036AAF]/10 group-hover:ring-[#036AAF]/15 sm:size-[3.25rem]">
        <Image
          src={getCategoryIconPath(id)}
          alt=""
          width={104}
          height={104}
          className="size-[85%] object-contain drop-shadow-[0_4px_12px_rgba(15,37,64,0.12)] transition-transform duration-300 group-hover:scale-110"
          sizes="52px"
          draggable={false}
        />
      </div>
      <h3 className="line-clamp-2 text-[10px] font-semibold leading-snug text-[#0f2540] sm:text-[11px]">
        {label}
      </h3>
    </article>
  );
}

const CategoryCarousel = forwardRef<
  CategoryCarouselHandle,
  {
    categories: readonly { id: string; label: string }[];
    reverse?: boolean;
  }
>(function CategoryCarousel({ categories, reverse = false }, ref) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const halfWidthRef = useRef(0);
  const loopItems = [...categories, ...categories];

  const updateHalfWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    halfWidthRef.current = track.scrollWidth / 2;
  }, []);

  const pauseBriefly = useCallback(() => {
    pausedRef.current = true;
    window.setTimeout(() => {
      pausedRef.current = false;
    }, 700);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scroll(direction) {
        const track = trackRef.current;
        if (!track) return;
        pauseBriefly();
        track.scrollBy({ left: direction * SCROLL_STEP, behavior: "smooth" });
      },
    }),
    [pauseBriefly],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateHalfWidth();

    const onScroll = () => {
      const half = halfWidthRef.current;
      if (half <= 0) return;

      if (track.scrollLeft >= half) {
        track.scrollLeft -= half;
      } else if (track.scrollLeft <= 0 && reverse) {
        track.scrollLeft += half;
      }
    };

    track.addEventListener("scroll", onScroll, { passive: true });

    let frame = 0;
    const tick = () => {
      if (!pausedRef.current) {
        const half = halfWidthRef.current;
        if (half > 0) {
          track.scrollLeft += reverse ? -AUTO_SCROLL_SPEED : AUTO_SCROLL_SPEED;
          if (!reverse && track.scrollLeft >= half) {
            track.scrollLeft -= half;
          }
          if (reverse && track.scrollLeft <= 0) {
            track.scrollLeft += half;
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onResize = () => updateHalfWidth();
    window.addEventListener("resize", onResize);

    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [reverse, updateHalfWidth]);

  return (
    <div
      className="relative py-1"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3.5 [&::-webkit-scrollbar]:hidden"
      >
        {loopItems.map((category, index) => (
          <CategoryChip
            key={`${category.id}-${index}`}
            id={category.id}
            label={category.label}
          />
        ))}
      </div>
    </div>
  );
});

export function LandingCategories() {
  const row0Ref = useRef<CategoryCarouselHandle>(null);
  const row1Ref = useRef<CategoryCarouselHandle>(null);
  const rowRefs = [row0Ref, row1Ref];

  function scrollCategories(direction: 1 | -1) {
    rowRefs.forEach((rowRef, index) => {
      const rowDirection: 1 | -1 =
        index % 2 === 1 ? (direction === 1 ? -1 : 1) : direction;
      rowRef.current?.scroll(rowDirection);
    });
  }

  return (
    <section
      id="kategoriler"
      className="relative scroll-mt-[72px] overflow-hidden bg-white px-6 py-12 md:px-10 md:py-16"
      aria-labelledby="kategoriler-baslik"
    >
      <div
        className="pointer-events-none absolute -left-20 top-0 size-64 rounded-full bg-[#036AAF]/8 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 size-56 rounded-full bg-[#0f2540]/5 blur-3xl"
        aria-hidden
      />

      <FadeInSection className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="kategoriler-baslik"
            className="text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
          >
            Her sektörden iş burada
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#1a1a1a]/55 sm:text-lg">
            İnşaattan sağlığa, lojistikten restorana — aradığın pozisyon hangi
            alanda olursa olsun, Ekmek&apos;te seni bekliyor.
          </p>
        </div>

        <div className="relative mt-8 sm:mt-9">
          {/* Gradient border frame */}
          <div className="rounded-[1.75rem] bg-gradient-to-br from-[#036AAF]/20 via-[#0f2540]/10 to-[#036AAF]/15 p-px shadow-[0_24px_64px_rgba(15,37,64,0.1)] sm:rounded-[2rem]">
            <div className="overflow-hidden rounded-[calc(1.75rem-1px)] bg-gradient-to-b from-[#f8fbff] to-[#eef4fa] sm:rounded-[calc(2rem-1px)]">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 border-b border-[#0f2540]/6 bg-white/60 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-3.5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#036AAF]/80 sm:text-[0.8125rem]">
                  {JOB_CATEGORIES.length} sektör kategorisi
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollCategories(-1)}
                    className="flex size-8 items-center justify-center rounded-full border border-[#036AAF]/15 bg-white text-[#036AAF] shadow-sm transition-all hover:border-[#036AAF]/30 hover:bg-[#036AAF]/5 hover:shadow-md active:scale-95 sm:size-9"
                    aria-label="Kategorileri sola kaydır"
                  >
                    <ChevronLeft className="size-4 sm:size-[1.125rem]" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCategories(1)}
                    className="flex size-8 items-center justify-center rounded-full border border-[#036AAF]/15 bg-white text-[#036AAF] shadow-sm transition-all hover:border-[#036AAF]/30 hover:bg-[#036AAF]/5 hover:shadow-md active:scale-95 sm:size-9"
                    aria-label="Kategorileri sağa kaydır"
                  >
                    <ChevronRight className="size-4 sm:size-[1.125rem]" aria-hidden />
                  </button>
                </div>
              </div>

              {/* Carousel area */}
              <div className="relative px-1 py-4 sm:px-2 sm:py-5">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#eef4fa] via-[#eef4fa]/80 to-transparent sm:w-16"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#eef4fa] via-[#eef4fa]/80 to-transparent sm:w-16"
                  aria-hidden
                />

                <div className="space-y-3 sm:space-y-4">
                  {CATEGORY_ROWS.map((row, index) => (
                    <div key={row[0]?.id ?? index}>
                      {index === 1 ? (
                        <div
                          className="mx-4 mb-3 h-px bg-gradient-to-r from-transparent via-[#036AAF]/15 to-transparent sm:mx-5"
                          aria-hidden
                        />
                      ) : null}
                      <CategoryCarousel
                        ref={rowRefs[index]}
                        categories={row}
                        reverse={index % 2 === 1}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeInSection>
    </section>
  );
}
