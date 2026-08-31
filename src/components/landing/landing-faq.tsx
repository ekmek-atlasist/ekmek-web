"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FadeInSection } from "./fade-in-section";

const faqItems = [
  {
    question: "Ekmek nedir, kimler kullanır?",
    answer:
      "Ekmek, iş arayanlarla işverenleri hızlıca buluşturan bir iş platformudur. İş arayanlar mobil uygulamayı kullanır; işverenler ilanlarını web paneli üzerinden yönetir.",
  },
  {
    question: "Kullanmak ücretli mi?",
    answer:
      "İş arayanlar uygulamayı ücretsiz kullanır. İşverenler için başlangıçta ücretsiz paketler sunulur; ilerleyen dönemde farklı planlar eklenebilir.",
  },
  {
    question: "İş arayan olarak nasıl başlarım?",
    answer:
      "Uygulamayı indir, telefon numaranla kayıt ol ve profilini birkaç adımda tamamla. Ardından sana uygun ilanları kaydırarak keşfetmeye başla.",
  },
  {
    question: "İşveren olarak ilan nasıl verilir?",
    answer:
      "Bilgisayarından ekmekisbul.com adresine gir, İşveren Girişi ile kayıt ol ve ilk ilanını oluştur. Onaylandıktan sonra adaylara görünür.",
  },
  {
    question: "İlanım ne zaman yayınlanır?",
    answer:
      "İlanlar yayına alınmadan önce kısa bir incelemeden geçer. Onaylandığında adayların karşısına çıkar; süre genellikle birkaç saat içinde tamamlanır.",
  },
  {
    question: "Verilerim güvende mi?",
    answer:
      "Ekmek KVKK'ya uyumlu çalışır. Kişisel bilgilerin yalnızca eşleştiğin taraflarla paylaşılır; üçüncü taraflara satılmaz.",
  },
];

function FaqItem({
  index,
  question,
  answer,
  open,
  onToggle,
}: {
  index: number;
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
        open
          ? "border-[#036AAF]/20 bg-white shadow-[0_8px_32px_rgba(3,106,175,0.08)]"
          : "border-neutral-200/70 bg-white/80 hover:border-[#036AAF]/10 hover:bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 px-5 py-5 text-left sm:px-6"
        aria-expanded={open}
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
            open
              ? "bg-[#036AAF] text-white"
              : "bg-[#036AAF]/10 text-[#036AAF]"
          }`}
        >
          {index + 1}
        </span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="block text-base font-bold leading-snug text-[#0f2540] sm:text-[1.05rem]">
            {question}
          </span>
        </span>
        <ChevronDown
          className={`mt-0.5 size-5 shrink-0 text-[#036AAF] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 pl-[4.25rem] text-sm leading-relaxed text-[#1a1a1a]/60 sm:px-6 sm:pb-6 sm:pl-[4.75rem] sm:text-[0.9375rem]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      className="relative overflow-hidden bg-white px-6 py-20 md:px-10 md:py-28"
      aria-labelledby="sss-baslik"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(3,106,175,0.05),transparent)]"
        aria-hidden
      />

      <FadeInSection className="relative mx-auto max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fafbfc] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#036AAF] ring-1 ring-[#036AAF]/10">
            <HelpCircle className="size-3.5" aria-hidden />
            Merak edilenler
          </span>
          <h2
            id="sss-baslik"
            className="mt-5 text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
          >
            Sıkça sorulan sorular
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#1a1a1a]/55 sm:text-lg">
            Aklına takılan bir şey mi var? En çok sorulan konuları burada
            topladık.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {faqItems.map((item, index) => (
            <FaqItem
              key={item.question}
              index={index}
              question={item.question}
              answer={item.answer}
              open={openIndex === index}
              onToggle={() =>
                setOpenIndex((current) => (current === index ? null : index))
              }
            />
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-[#1a1a1a]/45">
          Aradığını bulamadın mı?{" "}
          <Link
            href="/destek"
            className="font-semibold text-[#036AAF] underline-offset-2 hover:underline"
          >
            Destek sayfasından bize yaz
          </Link>
          .
        </p>
      </FadeInSection>
    </section>
  );
}
