"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "İlan nasıl açılır?",
    answer:
      "Panelden İlanlarım bölümüne gidin ve Yeni İlan butonuna tıklayın. Pozisyon, konum, çalışma şekli ve maaş bilgilerini doldurduktan sonra ilanınız onaya gönderilir. Onaylandığında adaylar ilanınızı görebilir.",
  },
  {
    question: "Başvurular nasıl değerlendirilir?",
    answer:
      "Başvurular menüsünden ilanınızı seçerek gelen adayları inceleyebilirsiniz. Bekleyen, kabul edilen ve reddedilen başvuruları ayrı sekmelerde görürsünüz. Onayladığınız adaylarla mesajlaşmaya başlayabilirsiniz.",
  },
  {
    question: "İlanım neden onay bekliyor?",
    answer:
      "Yeni ilanlar kalite ve güvenlik kontrolünden geçer. Eksik bilgi, yanıltıcı içerik veya platform kurallarına aykırı ifadeler onayı geciktirebilir. İlan durumunu İlanlarım sayfasından takip edebilirsiniz.",
  },
  {
    question: "Mesajlaşma nasıl çalışır?",
    answer:
      "Bir başvuruyu onayladığınızda adayla eşleşme oluşur ve Mesajlar bölümünde sohbet açılır. Mesajlar gerçek zamanlı iletilir; aday profilini sohbet üzerinden inceleyebilirsiniz.",
  },
  {
    question: "Destek talebi nasıl gönderilir?",
    answer:
      "Destek sayfasından konu seçerek mesajınızı iletebilirsiniz. Geçmiş taleplerinizi aynı sayfada görüntüleyebilir, ekibimizin yanıtını takip edebilirsiniz.",
  },
  {
    question: "Bir adayı engellersem ne olur?",
    answer:
      "Engellediğiniz adayla eşleşme ve sohbet kaldırılır. Engeli Profil sayfasından kaldırabilirsiniz; eski sohbet otomatik olarak geri gelmez.",
  },
] as const;

export default function PanelSssPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0f2540]">
        Sık Sorulan Sorular
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        İşveren paneli hakkında en çok sorulan konular.
      </p>

      <div className="mt-8 space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={item.question}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-neutral-50"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-[#0f2540]">
                  {item.question}
                </span>
                <ChevronDown
                  className={`size-5 shrink-0 text-[#036AAF] transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen ? (
                <div className="border-t border-neutral-100 px-5 py-4 text-sm leading-relaxed text-neutral-600">
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
