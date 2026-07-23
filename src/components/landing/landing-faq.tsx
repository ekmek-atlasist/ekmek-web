"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FadeInSection } from "./fade-in-section";

const faqItems = [
  {
    question: "Ekmek nedir?",
    answer:
      "Ekmek, iş arayanlarla işverenleri hızlıca buluşturan bir iş platformudur. İş arayanlar mobil uygulamayı kullanır, işverenler ilanlarını web üzerinden yönetir.",
  },
  {
    question: "Kullanmak ücretli mi?",
    answer:
      "Başlangıçta Ekmek'i ücretsiz kullanabilirsin. İlerleyen dönemde işverenlere yönelik farklı paketler sunulabilir.",
  },
  {
    question: "İş arayan olarak nasıl başlarım?",
    answer:
      "Mobil uygulamayı indir, telefon numaranla kayıt ol ve profilini oluştur. Ardından sana uygun ilanları kaydırmaya başla.",
  },
  {
    question: "İşveren olarak nasıl ilan veririm?",
    answer:
      "Bilgisayarından ekmekisbul.com adresine gir, İşveren Girişi'nden telefon numaranla kayıt ol ve ilk ilanını yayınla.",
  },
  {
    question: "İlanım ne zaman yayınlanır?",
    answer:
      "İlanlar yayına alınmadan önce kısa bir incelemeden geçer. Onaylandığında adaylara gösterilmeye başlar.",
  },
  {
    question: "Verilerim güvende mi?",
    answer:
      "Ekmek KVKK'ya uyumlu çalışır. Bilgilerin yalnızca eşleştiğin taraflarla paylaşılır.",
  },
];

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-[#0f2540] sm:text-lg">
          {question}
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-[#036AAF] transition-transform duration-200 ${
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
          <p className="px-5 pb-5 text-sm leading-relaxed text-[#1a1a1a]/70 sm:px-6 sm:pb-6">
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
      className="bg-white px-6 py-20 md:px-10 md:py-28"
      aria-labelledby="sss-baslik"
    >
      <FadeInSection className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2
            id="sss-baslik"
            className="text-3xl font-black tracking-tight text-[#0f2540] sm:text-4xl lg:text-5xl"
          >
            Sıkça Sorulan Sorular
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {faqItems.map((item, index) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === index}
              onToggle={() =>
                setOpenIndex((current) => (current === index ? null : index))
              }
            />
          ))}
        </div>
      </FadeInSection>
    </section>
  );
}
